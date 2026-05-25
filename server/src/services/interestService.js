import User from '../models/User.js';
import BalanceHistory from '../models/BalanceHistory.js';

// Helper: Get current time in Vietnam (GMT+7)
const getVietnamTime = (date = new Date()) => {
    return new Date(date.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
};

// Helper: Get start of day (midnight) in Vietnam time
const startOfDay = (date) => {
    const d = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
    d.setHours(0, 0, 0, 0);
    return d;
};

export const calculateDailyInterest = async () => {
    const nowVN = getVietnamTime();
    const cutOffDateStr = process.env.INTEREST_START_DATE || '2026-06-01T00:00:00+07:00';
    const startDate = new Date(cutOffDateStr);

    // Only start calculating on or after start date
    if (nowVN < startDate) {
        console.log(`[INTEREST CRON] Current date is before ${cutOffDateStr}. Skipping interest calculation.`);
        return;
    }

    console.log('[INTEREST CRON] Starting Daily Interest Calculation...');

    try {
        const users = await User.find({
            $or: [
                { aqeBalance: { $gt: 0 } },
                { preRegisterTokens: { $gt: 0 } }
            ]
        });

        const todayMidnight = startOfDay(nowVN);
        const cutOffDate = new Date(cutOffDateStr);

        for (const user of users) {
            // Find all successful AQE acquisitions (purchases/rewards)
            const acquisitions = await BalanceHistory.find({
                userId: user._id,
                symbol: 'AQE',
                status: 'SUCCESS',
                type: { $in: ['RECEIVE', 'REWARD'] }
            });

            if (acquisitions.length === 0) {
                continue;
            }

            let dailyInterestSum = 0;

            for (const acq of acquisitions) {
                const purchaseDateVN = getVietnamTime(acq.createdAt);

                let interestStartDate;
                if (purchaseDateVN < cutOffDate) {
                    interestStartDate = startOfDay(cutOffDate);
                } else {
                    interestStartDate = startOfDay(purchaseDateVN);
                }

                // Interest duration is 365 days
                const interestEndDate = new Date(interestStartDate.getTime() + 365 * 24 * 60 * 60 * 1000);

                // Today earns interest if it's within the [startDate, endDate) window
                if (todayMidnight >= interestStartDate && todayMidnight < interestEndDate) {
                    const dailyYield = acq.amount * 0.06 / 365;
                    dailyInterestSum += dailyYield;
                }
            }

            if (dailyInterestSum > 0) {
                const balanceBefore = user.provisionalAqeInterest || 0;
                user.provisionalAqeInterest = balanceBefore + dailyInterestSum;
                console.log({ dailyInterestSum, balanceBefore, user: user._id })

                await BalanceHistory.create({
                    userId: user._id,
                    amount: dailyInterestSum,
                    symbol: 'AQE',
                    type: 'INTEREST',
                    status: 'SUCCESS',
                    isOfficial: true,
                    balanceBefore: balanceBefore,
                    balanceAfter: user.provisionalAqeInterest,
                    description: `Daily Interest 6% APR consolidated daily yield`
                });
            }

            // Move provisional to claimable if today is the claim day (defaults to 1st of the month)
            const claimDay = Number(process.env.INTEREST_CLAIM_DAY || 1);
            if (nowVN.getDate() === claimDay) {
                if (user.provisionalAqeInterest > 0) {
                    user.claimableAqeInterest = (user.claimableAqeInterest || 0) + user.provisionalAqeInterest;
                    user.provisionalAqeInterest = 0;
                }
            }

            await user.save();
        }

        console.log('[INTEREST CRON] Daily Interest Calculation completed.');
    } catch (error) {
        console.error('[INTEREST CRON] Error:', error);
    }
};
