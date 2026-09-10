import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import BalanceHistory from '../models/BalanceHistory.js';
import { getSystemTime, getStartOfDay } from '../utils/time.js';

export const calculateDailyBonus = async () => {
    const nowVN = getSystemTime();
    const cutOffDateStr = process.env.INTEREST_START_DATE || '2026-06-01T00:00:00';
    const startDate = new Date(cutOffDateStr);

    // Only start calculating on or after start date
    if (nowVN < startDate) {
        console.log(`[BONUS CRON] Current date is before ${cutOffDateStr}. Skipping bonus calculation.`);
        return;
    }

    console.log('[BONUS CRON] Starting Daily Interest Calculation...');

    try {
        const todayMidnight = getStartOfDay(nowVN);
        const cutOffDate = new Date(cutOffDateStr);

        // Gather every qualifying USDT deposit across all users in a single query
        const deposits = await Transaction.find({
            status: 'SUCCESS',
            symbol: 'USDT',
            type: 'PAYMENT',
            countsForInterest: { $ne: false }
        }).select('from amount createdAt');

        const depositsByUser = new Map();
        for (const tx of deposits) {
            if (!tx.from) continue;
            const key = tx.from.toString();
            if (!depositsByUser.has(key)) depositsByUser.set(key, []);
            depositsByUser.get(key).push(tx);
        }

        for (const [userId, userDeposits] of depositsByUser.entries()) {
            let dailyInterestSum = 0;

            for (const tx of userDeposits) {
                const depositDateVN = getSystemTime(tx.createdAt);

                let interestStartDate;
                if (depositDateVN < cutOffDate) {
                    interestStartDate = getStartOfDay(cutOffDate);
                } else {
                    interestStartDate = getStartOfDay(depositDateVN);
                }

                // Interest duration is 365 days from the ORIGINAL deposit date (not reset)
                const interestEndDate = new Date(interestStartDate.getTime() + 365 * 24 * 60 * 60 * 1000);

                if (todayMidnight >= interestStartDate && todayMidnight < interestEndDate) {
                    const dailyYield = tx.amount * 0.06 / 365;
                    dailyInterestSum += dailyYield;
                }
            }

            if (dailyInterestSum <= 0) continue;

            const user = await User.findById(userId);
            if (!user) continue;

            const balanceBefore = user.provisionalUsdtInterest || 0;
            user.provisionalUsdtInterest = balanceBefore + dailyInterestSum;

            await BalanceHistory.create({
                userId: user._id,
                amount: dailyInterestSum,
                symbol: 'USDT',
                type: 'BONUS',
                status: 'SUCCESS',
                isOfficial: true,
                balanceBefore: balanceBefore,
                balanceAfter: user.provisionalUsdtInterest,
                description: `Daily Interest 6% APR on total USDT deposited`
            });

            // Move provisional to claimable if today is the claim day (defaults to 1st of the month)
            const claimDay = Number(process.env.BONUS_CLAIM_DAY || process.env.INTEREST_CLAIM_DAY || 1);
            if (nowVN.getDate() === claimDay && user.provisionalUsdtInterest > 0) {
                user.claimableUsdtInterest = (user.claimableUsdtInterest || 0) + user.provisionalUsdtInterest;
                user.provisionalUsdtInterest = 0;
            }

            await user.save();
        }

        console.log('[BONUS CRON] Daily Interest Calculation completed.');
    } catch (error) {
        console.error('[BONUS CRON] Error:', error);
    }
};
