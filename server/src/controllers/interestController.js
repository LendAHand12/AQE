import User from '../models/User.js';
import BalanceHistory from '../models/BalanceHistory.js';
import { TokenState } from '../models/Blockchain.js';

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

export const getInterestInfo = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Find all successful AQE acquisitions
        const acquisitions = await BalanceHistory.find({
            userId: user._id,
            symbol: 'AQE',
            status: 'SUCCESS',
            type: { $in: ['RECEIVE', 'REWARD'] }
        });

        const nowVN = getVietnamTime();
        const todayMidnight = startOfDay(nowVN);
        const cutOffDateStr = process.env.INTEREST_START_DATE || '2026-06-01T00:00:00+07:00';
        const cutOffDate = new Date(cutOffDateStr);

        let schedule = [];
        let maxInterestEndDate = null;

        // Process each acquisition to find the max end date
        const processedAcqs = acquisitions.map(acq => {
            const purchaseDateVN = getVietnamTime(acq.createdAt);
            let interestStartDate;
            if (purchaseDateVN < cutOffDate) {
                interestStartDate = startOfDay(cutOffDate);
            } else {
                interestStartDate = startOfDay(purchaseDateVN);
            }
            const interestEndDate = new Date(interestStartDate.getTime() + 365 * 24 * 60 * 60 * 1000);

            if (!maxInterestEndDate || interestEndDate > maxInterestEndDate) {
                maxInterestEndDate = interestEndDate;
            }

            return {
                amount: acq.amount,
                startDate: interestStartDate,
                endDate: interestEndDate
            };
        });

        // Generate schedule day-by-day starting from today up to maxInterestEndDate
        if (maxInterestEndDate && maxInterestEndDate > todayMidnight) {
            let currentDay = new Date(todayMidnight.getTime());
            while (currentDay < maxInterestEndDate) {
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

        // Calculate total remaining interest from today onwards
        let totalRemainingInterest = 0;
        schedule.forEach(item => {
            totalRemainingInterest += item.amount;
        });

        // Calculate total historical interest received
        const interestHistories = await BalanceHistory.find({
            userId: user._id,
            symbol: 'AQE',
            status: 'SUCCESS',
            type: 'INTEREST'
        }).select('amount');
        const totalInterestReceived = interestHistories.reduce((sum, h) => sum + h.amount, 0);

        // Check if user has claimed interest in the current calendar month
        const startOfMonthStr = `${nowVN.getFullYear()}-${String(nowVN.getMonth() + 1).padStart(2, '0')}-01T00:00:00+07:00`;
        const startOfMonthDate = new Date(startOfMonthStr);
        const claimedThisMonth = await BalanceHistory.findOne({
            userId: user._id,
            type: 'CLAIM_INTEREST',
            status: 'SUCCESS',
            createdAt: { $gte: startOfMonthDate }
        });

        res.json({
            totalInterestReceived: totalInterestReceived,
            provisionalAqeInterest: user.provisionalAqeInterest || 0,
            claimableAqeInterest: user.claimableAqeInterest || 0,
            firstPaymentDate: user.firstPaymentDate,
            totalRemainingInterest: totalRemainingInterest,
            hasClaimedThisMonth: !!claimedThisMonth,
            schedule: schedule
        });
    } catch (error) {
        console.error('Get Interest Info Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const claimInterest = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const amountToClaim = user.claimableAqeInterest;
        if (!amountToClaim || amountToClaim <= 0) {
            return res.status(400).json({ message: 'assets.interest.error_no_interest' });
        }

        // Enforce once-per-month claim limit
        const nowVN = getVietnamTime();
        const startOfMonthStr = `${nowVN.getFullYear()}-${String(nowVN.getMonth() + 1).padStart(2, '0')}-01T00:00:00+07:00`;
        const startOfMonthDate = new Date(startOfMonthStr);

        const claimedThisMonth = await BalanceHistory.findOne({
            userId: user._id,
            type: 'CLAIM_INTEREST',
            status: 'SUCCESS',
            createdAt: { $gte: startOfMonthDate }
        });

        if (claimedThisMonth) {
            return res.status(400).json({ 
                message: 'assets.interest.error_already_claimed' 
            });
        }

        // Pegged rate: 1 AQE = 1 USDT for interest claim
        const price = 1.0;
        
        const usdtAmount = amountToClaim * price;

        const balanceBefore = user.usdtBalance || 0;
        user.usdtBalance = balanceBefore + usdtAmount;
        user.claimableAqeInterest = 0; // Reset after claiming
        
        await user.save();

        await BalanceHistory.create({
            userId: user._id,
            amount: usdtAmount,
            symbol: 'USDT',
            type: 'CLAIM_INTEREST',
            status: 'SUCCESS',
            isOfficial: true,
            balanceBefore: balanceBefore,
            balanceAfter: user.usdtBalance,
            description: `Claimed ${amountToClaim.toFixed(5)} AQE Interest to ${usdtAmount.toFixed(5)} USDT (Rate: 1 AQE = ${price} USDT)`
        });

        res.json({ 
            success: true, 
            message: 'assets.interest.claim_success', 
            claimedAqe: amountToClaim,
            receivedUsdt: usdtAmount,
            newUsdtBalance: user.usdtBalance
        });
    } catch (error) {
        console.error('Claim Interest Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
