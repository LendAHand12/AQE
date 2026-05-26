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

export const getBonusInfo = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

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
        console.log({ eligibleBalance })

        // 3. Find all successful AQE acquisitions (RECEIVE only, representing principal)
        const acquisitions = await BalanceHistory.find({
            userId: user._id,
            symbol: 'AQE',
            status: 'SUCCESS',
            type: 'RECEIVE'
        }).sort({ createdAt: 1 }); // Oldest first for FIFO

        const nowVN = getVietnamTime();
        const todayMidnight = startOfDay(nowVN);
        const cutOffDateStr = process.env.INTEREST_START_DATE || '2026-06-01T00:00:00+07:00';
        const cutOffDate = new Date(cutOffDateStr);

        let schedule = [];
        let maxBonusEndDate = null;
        let remainingEligible = eligibleBalance;
        const processedAcqs = [];

        // FIFO: Match eligible balance to acquisitions
        for (const acq of acquisitions) {
            if (remainingEligible <= 0) break;
            const heldAmount = Math.min(acq.amount, remainingEligible);
            remainingEligible -= heldAmount;

            const purchaseDateVN = getVietnamTime(acq.createdAt);
            let bonusStartDate;
            if (purchaseDateVN < cutOffDate) {
                bonusStartDate = startOfDay(cutOffDate);
            } else {
                bonusStartDate = startOfDay(purchaseDateVN);
            }
            const bonusEndDate = new Date(bonusStartDate.getTime() + 365 * 24 * 60 * 60 * 1000);

            if (!maxBonusEndDate || bonusEndDate > maxBonusEndDate) {
                maxBonusEndDate = bonusEndDate;
            }

            processedAcqs.push({
                amount: heldAmount,
                startDate: bonusStartDate,
                endDate: bonusEndDate
            });
        }

        // If there is still remaining eligible balance (unrecorded in BalanceHistory, i.e. temporary AQE not yet in history)
        if (remainingEligible > 0) {
            const userCreateDateVN = getVietnamTime(user.createdAt);
            let bonusStartDate;
            if (userCreateDateVN < cutOffDate) {
                bonusStartDate = startOfDay(cutOffDate);
            } else {
                bonusStartDate = startOfDay(userCreateDateVN);
            }
            const bonusEndDate = new Date(bonusStartDate.getTime() + 365 * 24 * 60 * 60 * 1000);

            if (!maxBonusEndDate || bonusEndDate > maxBonusEndDate) {
                maxBonusEndDate = bonusEndDate;
            }

            processedAcqs.push({
                amount: remainingEligible,
                startDate: bonusStartDate,
                endDate: bonusEndDate
            });
        }

        // Check if today's daily bonus has already been credited
        const todayBonusExists = await BalanceHistory.findOne({
            userId: user._id,
            symbol: 'AQE',
            type: 'BONUS',
            status: 'SUCCESS',
            createdAt: { $gte: todayMidnight }
        });

        const scheduleStartDate = todayBonusExists
            ? new Date(todayMidnight.getTime() + 24 * 60 * 60 * 1000)
            : new Date(todayMidnight.getTime());

        // Generate schedule day-by-day starting from scheduleStartDate up to maxBonusEndDate
        if (maxBonusEndDate && maxBonusEndDate > scheduleStartDate) {
            let currentDay = new Date(scheduleStartDate.getTime());
            while (currentDay < maxBonusEndDate) {
                let dailySum = 0;
                processedAcqs.forEach(acq => {
                    if (currentDay >= acq.startDate && currentDay < acq.endDate) {
                        dailySum += acq.amount * 0.06 / 365;
                    }
                });

                if (dailySum > 0) {
                    schedule.push({
                        date: currentDay.toISOString(),
                        amount: dailySum
                    });
                }
                currentDay.setDate(currentDay.getDate() + 1);
            }
        }

        // Calculate total remaining bonus from today onwards
        let totalRemainingBonus = 0;
        schedule.forEach(item => {
            totalRemainingBonus += item.amount;
        });

        // Calculate total historical bonus received
        const bonusHistories = await BalanceHistory.find({
            userId: user._id,
            symbol: 'AQE',
            status: 'SUCCESS',
            type: 'BONUS'
        }).select('amount');
        const totalBonusReceived = bonusHistories.reduce((sum, h) => sum + h.amount, 0);

        // Check if user has claimed bonus in the current calendar month
        const startOfMonthStr = `${nowVN.getFullYear()}-${String(nowVN.getMonth() + 1).padStart(2, '0')}-01T00:00:00+07:00`;
        const startOfMonthDate = new Date(startOfMonthStr);
        const claimedThisMonth = await BalanceHistory.findOne({
            userId: user._id,
            type: 'CLAIM_BONUS',
            status: 'SUCCESS',
            createdAt: { $gte: startOfMonthDate }
        });

        res.json({
            totalBonusReceived: totalBonusReceived,
            provisionalAqeBonus: user.provisionalAqeBonus || 0,
            claimableAqeBonus: user.claimableAqeBonus || 0,
            firstPaymentDate: user.firstPaymentDate,
            totalRemainingBonus: totalRemainingBonus,
            totalExpectedBonus: eligibleBalance * 0.06,
            hasClaimedThisMonth: !!claimedThisMonth,
            schedule: schedule
        });
    } catch (error) {
        console.error('Get Bonus Info Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const claimBonus = async (req, res) => {
    try {
        const { claimType = 'USDT' } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const amountToClaim = user.claimableAqeBonus;
        if (!amountToClaim || amountToClaim <= 0) {
            return res.status(400).json({ message: 'assets.bonus.error_no_interest' });
        }

        // Enforce once-per-month claim limit
        const nowVN = getVietnamTime();
        const startOfMonthStr = `${nowVN.getFullYear()}-${String(nowVN.getMonth() + 1).padStart(2, '0')}-01T00:00:00+07:00`;
        const startOfMonthDate = new Date(startOfMonthStr);

        const claimedThisMonth = await BalanceHistory.findOne({
            userId: user._id,
            type: 'CLAIM_BONUS',
            status: 'SUCCESS',
            createdAt: { $gte: startOfMonthDate }
        });

        if (claimedThisMonth) {
            return res.status(400).json({
                message: 'assets.bonus.error_already_claimed'
            });
        }

        let responseData = {};

        if (claimType === 'AQE') {
            const balanceBefore = user.aqeBalance || 0;
            user.aqeBalance = balanceBefore + amountToClaim;
            user.claimableAqeBonus = 0; // Reset after claiming
            await user.save();

            // 1. Record CLAIM_BONUS transaction of symbol AQE
            await BalanceHistory.create({
                userId: user._id,
                amount: amountToClaim,
                symbol: 'AQE',
                type: 'CLAIM_BONUS',
                status: 'SUCCESS',
                isOfficial: true,
                balanceBefore: balanceBefore,
                balanceAfter: user.aqeBalance,
                description: `Reinvested ${amountToClaim.toFixed(5)} AQE Bonus to AQE balance`
            });

            responseData = {
                success: true,
                message: 'assets.bonus.claim_success',
                claimedAqe: amountToClaim,
                claimType: 'AQE',
                newAqeBalance: user.aqeBalance
            };
        } else {
            // Pegged rate: 1 AQE = 1 USDT for claim
            const price = 1.0;
            const usdtAmount = amountToClaim * price;

            const balanceBefore = user.usdtBalance || 0;
            user.usdtBalance = balanceBefore + usdtAmount;
            user.claimableAqeBonus = 0; // Reset after claiming

            await user.save();

            await BalanceHistory.create({
                userId: user._id,
                amount: usdtAmount,
                symbol: 'USDT',
                type: 'CLAIM_BONUS',
                status: 'SUCCESS',
                isOfficial: true,
                balanceBefore: balanceBefore,
                balanceAfter: user.usdtBalance,
                description: `Claimed ${amountToClaim.toFixed(5)} AQE Bonus to ${usdtAmount.toFixed(5)} USDT (Rate: 1 AQE = ${price} USDT)`
            });

            responseData = {
                success: true,
                message: 'assets.bonus.claim_success',
                claimedAqe: amountToClaim,
                claimType: 'USDT',
                receivedUsdt: usdtAmount,
                newUsdtBalance: user.usdtBalance
            };
        }

        res.json(responseData);
    } catch (error) {
        console.error('Claim Bonus Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
