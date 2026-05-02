import crypto from 'crypto';
import mongoose from 'mongoose';
import { TokenState } from '../models/Blockchain.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import Commission from '../models/Commission.js';
import Notification from '../models/Notification.js';
import BalanceHistory from '../models/BalanceHistory.js';
import { emitNotification } from '../utils/socket.js';

// Helper to generate a dummy hash
const generateHash = (data) => {
    return crypto.createHash('sha256').update(data + Date.now()).digest('hex');
};

// Helper to get current time in Vietnam (GMT+7)
const getVietnamTime = () => {
    return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
};

// Helper: Process Commissions
async function processCommissions(buyer, amountPaid) {
    if (!buyer.referredBy) return;

    const amountF1 = amountPaid * 0.08;
    const amountF2 = amountPaid * 0.02;

    // F1 - 8%
    const f1 = await User.findById(buyer.referredBy);
    if (f1) {
        const balanceBeforeF1 = f1.usdtBalance || 0;
        f1.usdtBalance = (f1.usdtBalance || 0) + amountF1;
        await f1.save();
        
        await Commission.create({
            recipientId: f1._id,
            fromUserId: buyer._id,
            amountUsdt: amountF1,
            level: 1,
            percentage: 8,
            salesAmount: amountPaid
        });

        // Add to Balance History for recipient
        await BalanceHistory.create({
            userId: f1._id,
            amount: amountF1,
            symbol: 'USDT',
            type: 'COMMISSION',
            status: 'SUCCESS',
            isOfficial: true,
            balanceBefore: balanceBeforeF1,
            balanceAfter: f1.usdtBalance,
            description: `Commission Level 1 from ${buyer.username}`
        });

        // F2 - 2%
        if (f1.referredBy) {
            const f2 = await User.findById(f1.referredBy);
            if (f2) {
                const balanceBeforeF2 = f2.usdtBalance || 0;
                f2.usdtBalance = (f2.usdtBalance || 0) + amountF2;
                await f2.save();
                
                await Commission.create({
                    recipientId: f2._id,
                    fromUserId: buyer._id,
                    amountUsdt: amountF2,
                    level: 2,
                    percentage: 2,
                    salesAmount: amountPaid
                });

                // Add to Balance History for recipient
                await BalanceHistory.create({
                    userId: f2._id,
                    amount: amountF2,
                    symbol: 'USDT',
                    type: 'COMMISSION',
                    status: 'SUCCESS',
                    isOfficial: true,
                    balanceBefore: balanceBeforeF2,
                    balanceAfter: f2.usdtBalance,
                    description: `Commission Level 2 from ${buyer.username}`
                });
            }
        }
    }
}

// @desc    Submit a pledge for Pre-registration
export const submitPreRegisterPledge = async (req, res) => {
    const { pledgeAmount } = req.body;
    try {
        if (pledgeAmount < 100) {
            return res.status(400).json({ message: 'payments.errors.min_pledge' });
        }

        const user = await User.findById(req.user._id);
        
        // If they already have a pledge
        if (user.pledgeUsdt > 0) {
            // If current round is not finished, they can only change if they haven't paid anything
            if (!user.isPledgeCompleted) {
                if (user.paidUsdtPreRegister > 0) {
                    return res.status(400).json({ message: 'payments.errors.cannot_change_pledge' });
                }
                // If they haven't paid, just update the pledge amount
                user.pledgeUsdt = pledgeAmount;
            } else {
                // Current round IS finished. ARCHIVE it and start new round.
                user.pledgeRounds.push({
                    roundNumber: user.pledgeRounds.length + 1,
                    pledgeUsdt: user.pledgeUsdt,
                    paidUsdt: user.paidUsdtPreRegister,
                    tokensReceived: user.preRegisterTokens,
                    bonusPercent: user.hasReceivedPromotion ? (new Date() <= new Date('2026-05-31') ? 0.10 : 0.05) : 0, // rough estimate or we can store the actual
                    completedAt: new Date()
                });

                // Reset for new round
                user.pledgeUsdt = pledgeAmount;
                user.paidUsdtPreRegister = 0;
                user.preRegisterTokens = 0;
                user.hasReceivedPromotion = false;
                user.isPledgeCompleted = false;
            }
        } else {
            // First time ever registering
            user.pledgeUsdt = pledgeAmount;
        }

        await user.save();

        res.json({ message: 'payments.pledge_success', pledgeUsdt: user.pledgeUsdt });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Handle Actual Payment via WalletConnect
export const submitPreRegisterPayment = async (req, res) => {
    const { hash, amount, pledgeAmount } = req.body;
    const amountNum = parseFloat(amount);
    const pledgeAmountNum = parseFloat(pledgeAmount);

    try {
        const user = await User.findById(req.user._id);

        const nowVN = getVietnamTime();
        const may31VN = new Date('2026-05-31T23:59:59+07:00');
        const june30VN = new Date('2026-06-30T23:59:59+07:00');
        const julyFirstVN = new Date('2026-07-01T00:00:00+07:00');

        if (user.kycStatus !== 'verified' && user.kycStatus !== 'pending') {
            return res.status(403).json({ message: 'payments.errors.kyc_required' });
        }

        // If no pledge OR previous pledge is completed, allow starting a new one
        if (!user.pledgeUsdt || user.pledgeUsdt <= 0 || user.isPledgeCompleted) {
            if (user.isPledgeCompleted) {
                // Archive previous round
                user.pledgeRounds.push({
                    roundNumber: user.pledgeRounds.length + 1,
                    pledgeUsdt: user.pledgeUsdt,
                    paidUsdt: user.paidUsdtPreRegister,
                    tokensReceived: user.preRegisterTokens,
                    bonusPercent: user.hasReceivedPromotion ? (nowVN <= may31VN ? 0.10 : 0.05) : 0,
                    completedAt: new Date()
                });
                
                // Reset for new round
                user.paidUsdtPreRegister = 0;
                user.preRegisterTokens = 0;
                user.hasReceivedPromotion = false;
                user.isPledgeCompleted = false;
            }

            if (!pledgeAmountNum || pledgeAmountNum < 100) {
                return res.status(400).json({ message: 'payments.errors.min_pledge' });
            }
            if (amountNum < (pledgeAmountNum * 0.3)) {
                return res.status(400).json({ 
                    message: 'payments.errors.min_first_payment',
                    minAmount: (pledgeAmountNum * 0.3)
                });
            }
            user.pledgeUsdt = pledgeAmountNum;
        }

        if (user.paidUsdtPreRegister === 0 && amountNum < (user.pledgeUsdt * 0.3)) {
            return res.status(400).json({ 
                message: 'payments.errors.min_first_payment',
                minAmount: (user.pledgeUsdt * 0.3)
            });
        }

        let phase = 'PRE_REGISTER';
        let price = 1.0;

        if (nowVN >= julyFirstVN) {
            phase = 'LIVE';
            const stats = await TokenState.findOne({ symbol: 'AQE' });
            price = stats ? stats.currentPrice : 1.0;
        }

        const tokensCalculated = amountNum / price;
        
        // Define Month End Deadlines
        const isPostMay = nowVN > may31VN;
        const isPostJune = nowVN > june30VN;
        const isLivePhase = nowVN >= julyFirstVN;

        // --- STEP 1: PROCESS CURRENT PAYMENT (USDT) ---
        await Transaction.create({
            hash,
            from: user._id,
            to: 'System',
            amount: amountNum,
            symbol: 'USDT',
            type: 'PAYMENT',
            status: 'SUCCESS',
            description: `Payment for AQE in ${isLivePhase ? 'Live' : (isPostMay ? 'June' : 'May')} phase`
        });

        console.log(`[Payment] User: ${user.username}, Paid: ${user.paidUsdtPreRegister}, Pledge: ${user.pledgeUsdt}, isPledgeCompleted: ${user.isPledgeCompleted}, isLivePhase: ${isLivePhase}`);

        // --- STEP 2: LOG TOKEN RECEIPT (AQE) IN BALANCE HISTORY ---
        await BalanceHistory.create({
            userId: user._id,
            amount: tokensCalculated,
            symbol: 'AQE',
            type: 'RECEIVE',
            status: 'SUCCESS',
            isOfficial: isLivePhase ? true : user.isPledgeCompleted ? true : false,
            balanceBefore: user.aqeBalance + user.preRegisterTokens,
            balanceAfter: user.aqeBalance + user.preRegisterTokens + tokensCalculated,
            description: `Purchased AQE in ${isLivePhase ? 'Live' : (isPostMay ? 'June' : 'May')} phase`
        });

        // Trigger Commission Immediately after successful payment
        await processCommissions(user, amountNum);

        if (isLivePhase) {
            // Case July onwards: Instant release for everything
            user.aqeBalance += tokensCalculated;
            
            const releaseNotif = await Notification.create({
                userId: user._id,
                title: 'Token Purchase Successful',
                message: 'Your payment has been processed and tokens added to your balance.',
                type: 'PAYMENT',
                isRead: false
            });
            emitNotification(user._id, releaseNotif);
        } else {
            // Pre-register phases (May or June) - Accumulate vs 100% hit
            user.paidUsdtPreRegister += amountNum;
            user.preRegisterTokens += tokensCalculated;

            // Check if 100% hit WITHIN the same month to get bonus
            if (user.paidUsdtPreRegister >= user.pledgeUsdt && !user.isPledgeCompleted) {
                if (!user.hasReceivedPromotion) {
                    let bonusPercent = 0;
                    if (nowVN <= may31VN) bonusPercent = 0.10;
                    else if (nowVN <= june30VN) bonusPercent = 0.05;

                    if (bonusPercent > 0) {
                        const bonusTokens = (user.pledgeUsdt / price) * bonusPercent;
                        const beforeBonus = user.preRegisterTokens;
                        user.preRegisterTokens += bonusTokens;
                        user.hasReceivedPromotion = true;
                        
                        await BalanceHistory.create({
                            userId: user._id,
                            amount: bonusTokens,
                            symbol: 'AQE',
                            type: 'REWARD',
                            status: 'SUCCESS',
                            isOfficial: true,
                            balanceBefore: beforeBonus,
                            balanceAfter: user.preRegisterTokens,
                            description: `Full payment bonus of ${bonusPercent * 100}% for completing pledge`
                        });

                        const bonusNotif = await Notification.create({
                            userId: user._id,
                            title: 'Bonus Reward Received',
                            message: `Congratulations! You have received a ${bonusPercent * 100}% bonus for completing your pledge.`,
                            type: 'REWARD',
                            isRead: false
                        });
                        emitNotification(user._id, bonusNotif);
                    }
                }

                // Immediate release since 100% reached for the first time
                user.aqeBalance += user.preRegisterTokens;
                user.preRegisterTokens = 0;
                user.isPledgeCompleted = true; // Mark as completed

                // Update all previous temporary AQE entries to official
                await BalanceHistory.updateMany(
                    { userId: user._id, symbol: 'AQE', isOfficial: false },
                    { isOfficial: true }
                );
            } else if (user.isPledgeCompleted) {
                // If they already completed but are paying more, release instantly
                user.aqeBalance += tokensCalculated;
                user.preRegisterTokens = 0;
            }
        }

        await user.save();
        res.json({ 
            message: 'payments.payment_success', 
            paidSoFar: user.paidUsdtPreRegister,
            tokensAccumulated: user.preRegisterTokens 
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get current user's pre-register status
export const getMyPreRegister = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('username pledgeUsdt paidUsdtPreRegister preRegisterTokens hasReceivedPromotion aqeBalance isPledgeCompleted pledgeRounds');
        
        // Return null if no pledge made
        if (!user.pledgeUsdt || user.pledgeUsdt <= 0) return res.json(null);

        const nowVN = getVietnamTime();
        const may31VN = new Date('2026-05-31T23:59:59+07:00');
        const june30VN = new Date('2026-06-30T23:59:59+07:00');
        const julyFirstVN = new Date('2026-07-01T00:00:00+07:00');

        // AUTO-RELEASE CHECK (Lazy Evaluation on View)
        if (user.preRegisterTokens > 0) {
            const lastBuy = await BalanceHistory.findOne({ userId: user._id, type: 'RECEIVE', symbol: 'AQE' }).sort({ createdAt: -1 });
            if (lastBuy) {
                const lastDate = new Date(lastBuy.createdAt);
                let shouldForceRelease = false;
                
                if (lastDate <= may31VN && nowVN > may31VN) shouldForceRelease = true;
                else if (lastDate <= june30VN && nowVN > june30VN) shouldForceRelease = true;
                else if (nowVN >= julyFirstVN) shouldForceRelease = true;

                if (shouldForceRelease) {
                    user.aqeBalance += user.preRegisterTokens;
                    user.preRegisterTokens = 0;
                    
                    // Mark all previous temporary entries as official
                    await BalanceHistory.updateMany(
                        { userId: user._id, symbol: 'AQE', isOfficial: false },
                        { isOfficial: true }
                    );

                    await user.save();
                }
            }
        }

        // Fetch transactions for this user that are related to Pre-register or Live Buy
        const transactions = await Transaction.find({ from: req.user._id, type: 'BUY' }).sort({ createdAt: -1 });

        res.json({
            userId: user._id,
            username: user.username,
            pledgeUsdt: user.pledgeUsdt,
            paidUsdtPreRegister: user.paidUsdtPreRegister,
            preRegisterTokens: user.preRegisterTokens,
            hasReceivedPromotion: user.hasReceivedPromotion,
            status: user.paidUsdtPreRegister >= user.pledgeUsdt ? 'completed' : (user.paidUsdtPreRegister > 0 ? 'partial' : 'pending'),
            transactions,
            pledgeRounds: user.pledgeRounds
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get current user's payment history (USDT)
export const getUserPayments = async (req, res) => {
    try {
        const userId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = { 
            from: new mongoose.Types.ObjectId(userId), 
            type: 'PAYMENT'
        };

        const total = await Transaction.countDocuments(query);
        const transactions = await Transaction.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Calculate total paid USDT
        const stats = await Transaction.aggregate([
            { $match: { from: new mongoose.Types.ObjectId(userId), type: 'PAYMENT', status: 'SUCCESS' } },
            { $group: { _id: null, totalPaid: { $sum: "$amount" } } }
        ]);

        res.json({
            transactions,
            page,
            pages: Math.ceil(total / limit),
            total,
            summary: {
                totalPaid: stats.length > 0 ? stats[0].totalPaid : 0
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get ALL transactions (Admin only)
export const getAllTransactionsForAdmin = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const category = req.query.category; // 'USDT', 'COMMISSION', 'AQE'
        const search = req.query.search || '';

        // Helper function to create Vietnamese accent-insensitive regex
        const createVietnameseRegex = (str) => {
            const map = {
                'a': '[aàáảãạăằắẳẵặâầấẩẫậ]',
                'e': '[eèéẻẽẹêềếểễệ]',
                'i': '[iìíỉĩị]',
                'o': '[oòóỏõọôồốổỗộơờớởỡợ]',
                'u': '[uùúủũụưừứửữự]',
                'y': '[yỳýỷỹỵ]',
                'd': '[dđ]',
                'A': '[AÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬ]',
'D': '[DĐ]'
            };
            let regexStr = str;
            Object.keys(map).forEach(key => {
                regexStr = regexStr.replace(new RegExp(key, 'g'), map[key]);
            });
            return new RegExp(regexStr, 'i');
        };

        const queryRegex = search ? createVietnameseRegex(search) : null;

        let results = [];
        let total = 0;

        if (category === 'USDT') {
            const query = { symbol: 'USDT', ...(queryRegex && { description: { $regex: queryRegex } }) };
            total = await Transaction.countDocuments(query);
            const data = await Transaction.find(query)
                .populate({ path: 'from', select: 'username fullName email' })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);
            
            results = data.map(tx => ({
                _id: tx._id,
                hash: tx.hash,
                from: tx.from, // populated object or raw id
                to: tx.to,
                amount: tx.amount,
                symbol: tx.symbol,
                type: tx.type,
                status: tx.status,
                description: tx.description,
                createdAt: tx.createdAt
            }));
        } else if (category === 'COMMISSION') {
            const query = {}; // Add search if needed
            total = await Commission.countDocuments(query);
            const data = await Commission.find(query)
                .populate('recipientId', 'username fullName email')
                .populate('fromUserId', 'username fullName email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            results = data.map(c => ({
                _id: c._id,
                from: c.fromUserId,
                to: c.recipientId,
                amount: c.amountUsdt,
                salesAmount: c.salesAmount || Math.round(c.amountUsdt / (c.percentage / 100)),
                level: c.level,
                percentage: c.percentage,
                symbol: 'USDT',
                type: 'COMMISSION',
                status: 'SUCCESS',
                description: `Level ${c.level} Commission (${c.percentage}%)`,
                createdAt: c.createdAt
            }));
        } else {
            // AQE or other tokens
            const query = { ...(category !== 'ALL' && { symbol: category || 'AQE' }) };
            total = await BalanceHistory.countDocuments(query);
            const data = await BalanceHistory.find(query)
                .populate('userId', 'username fullName email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            results = data.map(bh => ({
                _id: bh._id,
                to: bh.userId,
                amount: bh.amount,
                symbol: bh.symbol,
                type: bh.type,
                status: bh.status,
                isOfficial: bh.isOfficial,
                description: bh.description,
                createdAt: bh.createdAt
            }));
        }

        res.json({
            transactions: results,
            page,
            pages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
