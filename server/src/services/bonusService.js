import User from '../models/User.js';
import BalanceHistory from '../models/BalanceHistory.js';
import { getSystemTime, getStartOfDay } from '../utils/time.js';

export const calculateDailyBonus = async () => {
    const nowVN = getSystemTime();
    const cutOffDateStr = process.env.BONUS_START_DATE || process.env.INTEREST_START_DATE || '2026-06-01T00:00:00';
    const startDate = new Date(cutOffDateStr);

    // Only start calculating on or after start date
    if (nowVN < startDate) {
        console.log(`[BONUS CRON] Current date is before ${cutOffDateStr}. Skipping bonus calculation.`);
        return;
    }

    console.log('[BONUS CRON] Starting Daily Bonus Calculation...');

    try {
        const users = await User.find({
            $or: [
                { aqeBalance: { $gt: 0 } },
                { preRegisterTokens: { $gt: 0 } }
            ]
        });

        const todayMidnight = getStartOfDay(nowVN);
        const cutOffDate = new Date(cutOffDateStr);

        for (const user of users) {
            // 1. Sum up all successful REWARD transactions (pledge rewards) for this user
            const rewardTransactions = await BalanceHistory.find({
                userId: user._id,
                symbol: 'AQE',
                status: 'SUCCESS',
                type: 'REWARD'
            });
            const totalRewardAqe = rewardTransactions.reduce((sum, tx) => sum + tx.amount, 0);

            // 2. Eligible balance is current total holdings (aqeBalance + preRegisterTokens) minus the reward tokens
            const eligibleBalance = Math.max(0, (user.aqeBalance + user.preRegisterTokens) - totalRewardAqe);

            // 3. Find all successful AQE acquisitions (RECEIVE only, representing principal)
            const acquisitions = await BalanceHistory.find({
                userId: user._id,
                symbol: 'AQE',
                status: 'SUCCESS',
                type: 'RECEIVE'
            }).sort({ createdAt: 1 }); // Oldest first for FIFO

            if (eligibleBalance <= 0) {
                continue;
            }

            let dailyBonusSum = 0;
            let remainingEligible = eligibleBalance;

            if (acquisitions.length > 0) {
                for (const acq of acquisitions) {
                    if (remainingEligible <= 0) break;

                    // FIFO: Match eligible balance to acquisitions
                    const heldAmount = Math.min(acq.amount, remainingEligible);
                    remainingEligible -= heldAmount;

                    const purchaseDateVN = getSystemTime(acq.createdAt);

                    let bonusStartDate;
                    if (purchaseDateVN < cutOffDate) {
                        bonusStartDate = getStartOfDay(cutOffDate);
                    } else {
                        bonusStartDate = getStartOfDay(purchaseDateVN);
                    }

                    // Bonus duration is 365 days
                    const bonusEndDate = new Date(bonusStartDate.getTime() + 365 * 24 * 60 * 60 * 1000);

                    // Today earns bonus if it's within the [startDate, endDate) window
                    if (todayMidnight >= bonusStartDate && todayMidnight < bonusEndDate) {
                        const dailyYield = heldAmount * 0.06 / 365;
                        dailyBonusSum += dailyYield;
                    }
                }
            }

            // If there is still remaining eligible balance (unrecorded in BalanceHistory)
            if (remainingEligible > 0) {
                const userCreateDateVN = getSystemTime(user.createdAt);
                let bonusStartDate;
                if (userCreateDateVN < cutOffDate) {
                    bonusStartDate = getStartOfDay(cutOffDate);
                } else {
                    bonusStartDate = getStartOfDay(userCreateDateVN);
                }
                const bonusEndDate = new Date(bonusStartDate.getTime() + 365 * 24 * 60 * 60 * 1000);

                if (todayMidnight >= bonusStartDate && todayMidnight < bonusEndDate) {
                    const dailyYield = remainingEligible * 0.06 / 365;
                    dailyBonusSum += dailyYield;
                }
            }

            if (dailyBonusSum > 0) {
                const balanceBefore = user.provisionalAqeBonus || 0;
                user.provisionalAqeBonus = balanceBefore + dailyBonusSum;
                console.log({ dailyBonusSum, balanceBefore, user: user._id });

                await BalanceHistory.create({
                    userId: user._id,
                    amount: dailyBonusSum,
                    symbol: 'AQE',
                    type: 'BONUS',
                    status: 'SUCCESS',
                    isOfficial: true,
                    balanceBefore: balanceBefore,
                    balanceAfter: user.provisionalAqeBonus,
                    description: `Daily Bonus 6% APR consolidated daily yield`
                });
            }

            // Move provisional to claimable if today is the claim day (defaults to 1st of the month)
            const claimDay = Number(process.env.BONUS_CLAIM_DAY || process.env.INTEREST_CLAIM_DAY || 1);
            if (nowVN.getDate() === claimDay) {
                if (user.provisionalAqeBonus > 0) {
                    user.claimableAqeBonus = (user.claimableAqeBonus || 0) + user.provisionalAqeBonus;
                    user.provisionalAqeBonus = 0;
                }
            }

            await user.save();
        }

        console.log('[BONUS CRON] Daily Bonus Calculation completed.');
    } catch (error) {
        console.error('[BONUS CRON] Error:', error);
    }
};
