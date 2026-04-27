import crypto from 'crypto';
import { TokenState } from '../models/Blockchain.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import Commission from '../models/Commission.js';
import Notification from '../models/Notification.js';
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

    // F1 - 8% of total pledge
    const f1 = await User.findById(buyer.referredBy);
    if (f1) {
        const oldBalanceF1 = f1.usdtBalance;
        f1.usdtBalance += amountF1;
        await f1.save();
        
        await Commission.create({
            recipientId: f1._id,
            fromUserId: buyer._id,
            amountUsdt: amountF1,
            level: 1,
            percentage: 8
        });

        // Create Ledger Entry (Transaction) for Balance History
        await Transaction.create({
            hash: '0x' + generateHash('commF1' + buyer._id),
            from: buyer._id, 
            to: f1._id,      
            amount: amountF1,
            symbol: 'USDT',
            type: 'COMMISSION',
            status: 'SUCCESS',
            balanceBefore: oldBalanceF1,
            balanceAfter: f1.usdtBalance,
            description: `F1 Commission from ${buyer.username}`
        });

        // F2 - 2%
        if (f1.referredBy) {
            const f2 = await User.findById(f1.referredBy);
            if (f2) {
                const oldBalanceF2 = f2.usdtBalance;
                f2.usdtBalance += amountF2;
                await f2.save();
                
                await Commission.create({
                    recipientId: f2._id,
                    fromUserId: buyer._id,
                    amountUsdt: amountF2,
                    level: 2,
                    percentage: 2
                });

                await Transaction.create({
                    hash: '0x' + generateHash('commF2' + buyer._id),
                    from: buyer._id,
                    to: f2._id,
                    amount: amountF2,
                    symbol: 'USDT',
                    type: 'COMMISSION',
                    status: 'SUCCESS',
                    balanceBefore: oldBalanceF2,
                    balanceAfter: f2.usdtBalance,
                    description: `F2 Commission from ${buyer.username}`
                });
            }
        }
    }
}

// @desc    Submit a pledge for Pre-registration
export const submitPreRegisterPledge = async (req, res) => {
    const { pledgeAmount } = req.body;
    try {
        if (pledgeAmount < 10) {
            return res.status(400).json({ message: 'Số tiền đăng ký mua tối thiểu là 10 USDT' });
        }

        const user = await User.findById(req.user._id);
        if (user.pledgeUsdt > 0 && user.paidUsdtPreRegister > 0) {
            return res.status(400).json({ message: 'Bạn không thể thay đổi số tiền cam kết sau khi đã thực hiện thanh toán' });
        }

        user.pledgeUsdt = pledgeAmount;
        await user.save();

        res.json({ message: 'Đăng ký số tiền mua sớm thành công', pledgeUsdt: user.pledgeUsdt });
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

        if (user.kycStatus !== 'verified') {
            return res.status(403).json({ message: 'Bạn cần hoàn thành và được duyệt KYC bước 1 để thực hiện thanh toán' });
        }

        if (!user.pledgeUsdt || user.pledgeUsdt <= 0) {
            if (!pledgeAmountNum || pledgeAmountNum < 10) {
                return res.status(400).json({ message: 'Số tiền đăng ký mua tối thiểu là 10 USDT' });
            }
            if (amountNum < (pledgeAmountNum * 0.3)) {
                return res.status(400).json({ message: `Lần thanh toán đầu tiên phải tối thiểu 30% (${(pledgeAmountNum * 0.3).toLocaleString()} USDT)` });
            }
            user.pledgeUsdt = pledgeAmountNum;
        }

        if (user.paidUsdtPreRegister === 0 && amountNum < (user.pledgeUsdt * 0.3)) {
            return res.status(400).json({ message: `Lần thanh toán đầu tiên phải tối thiểu 30% (${(user.pledgeUsdt * 0.3).toLocaleString()} USDT)` });
        }

        const nowVN = getVietnamTime();
        const may31VN = new Date('2026-05-31T23:59:59+07:00');
        const june30VN = new Date('2026-06-30T23:59:59+07:00');
        const julyFirstVN = new Date('2026-07-01T00:00:00+07:00');
        
        let phase = 'PRE_REGISTER';
        let price = 1.0;

        if (nowVN >= julyFirstVN) {
            phase = 'LIVE';
            const stats = await TokenState.findOne({ symbol: 'AQE' });
            price = stats ? stats.currentPrice : 1.0;
        }

        const tokensCalculated = amountNum / price;
        const oldPreRegisterTokens = user.preRegisterTokens;
        
        // Define Month End Deadlines
        const isPostMay = nowVN > may31VN;
        const isPostJune = nowVN > june30VN;
        const isLivePhase = nowVN >= julyFirstVN;

        // --- STEP 1: PROCESS CURRENT PAYMENT ---
        await Transaction.create({
            hash,
            from: null, // System (Contract)
            to: user._id,
            amount: tokensCalculated,
            usdtAmount: amountNum,
            priceAtTime: price,
            phase,
            symbol: 'AQE',
            type: 'BUY',
            status: 'SUCCESS',
            isReleased: isLivePhase ? true : false,
            balanceBefore: user.preRegisterTokens,
            balanceAfter: user.preRegisterTokens + (isLivePhase ? 0 : tokensCalculated),
            description: `Payment in ${isLivePhase ? 'Live' : (isPostMay ? 'June' : 'May')} phase (from AQE Contract)`
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
                        
                        await Transaction.create({
                            hash: '0x' + generateHash('bonus' + user._id),
                            from: null, // System (Contract)
                            to: user._id,
                            amount: bonusTokens,
                            symbol: 'AQE',
                            type: 'REWARD',
                            status: 'SUCCESS',
                            phase,
                            isReleased: true,
                            balanceBefore: beforeBonus,
                            balanceAfter: user.preRegisterTokens,
                            description: `Full payment bonus of ${bonusPercent * 100}% on ${user.pledgeUsdt} USDT (from AQE Contract)`
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
                user.isPledgeCompleted = true; // Mark as completed to avoid re-triggering commission

                // --- STEP 4: RELEASE PREVIOUSLY HELD TOKENS ---
                // Simply flip the status of all BUY transactions for this user.
                await Transaction.updateMany(
                    { 
                        to: user._id, 
                        isReleased: false, 
                        status: 'SUCCESS',
                        type: { $in: ['BUY', 'REWARD'] }
                    },
                    { isReleased: true }
                );

                // await processCommissions(user, user.pledgeUsdt); // REMOVED: Now paid on every payment
            } else if (user.isPledgeCompleted) {
                // If they already completed but are paying more, release instantly
                const oldBal = user.aqeBalance;
                user.aqeBalance += tokensCalculated;
                user.preRegisterTokens = 0;

                // For subsequent payments after 100%, those are also released instantly
                await Transaction.updateOne(
                    { hash: hash },
                    { isReleased: true }
                );
            }
        }

        await user.save();
        res.json({ 
            message: 'Thanh toán thành công', 
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
        const user = await User.findById(req.user._id).select('username pledgeUsdt paidUsdtPreRegister preRegisterTokens hasReceivedPromotion aqeBalance isPledgeCompleted');
        
        // Return null if no pledge made
        if (!user.pledgeUsdt || user.pledgeUsdt <= 0) return res.json(null);

        const nowVN = getVietnamTime();
        const may31VN = new Date('2026-05-31T23:59:59+07:00');
        const june30VN = new Date('2026-06-30T23:59:59+07:00');
        const julyFirstVN = new Date('2026-07-01T00:00:00+07:00');

        // AUTO-RELEASE CHECK (Lazy Evaluation on View)
        if (user.preRegisterTokens > 0) {
            const lastBuy = await Transaction.findOne({ from: user._id, type: 'BUY', symbol: 'AQE' }).sort({ createdAt: -1 });
            if (lastBuy) {
                const lastDate = new Date(lastBuy.createdAt);
                let shouldForceRelease = false;
                
                if (lastDate <= may31VN && nowVN > may31VN) shouldForceRelease = true;
                else if (lastDate <= june30VN && nowVN > june30VN) shouldForceRelease = true;
                else if (nowVN >= julyFirstVN) shouldForceRelease = true;

                if (shouldForceRelease) {
                    user.aqeBalance += user.preRegisterTokens;
                    user.preRegisterTokens = 0;

                    // Release all BUY/REWARD transactions that occurred BEFORE or DURING the month being closed
                    await Transaction.updateMany(
                        { 
                            to: user._id, 
                            isReleased: false, 
                            status: 'SUCCESS',
                            type: { $in: ['BUY', 'REWARD'] },
                            createdAt: { $lte: (lastDate <= may31VN ? may31VN : (lastDate <= june30VN ? june30VN : nowVN)) }
                        },
                        { isReleased: true }
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
            transactions
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get current user's payment history (USDT -> AQE)
export const getUserPayments = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = { 
            $or: [
                { from: req.user._id, type: { $in: ['BUY', 'SELL'] } },
                { to: req.user._id, type: { $in: ['BUY', 'REWARD', 'COMMISSION'] } }
            ]
        };

        const total = await Transaction.countDocuments(query);
        const transactions = await Transaction.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Calculate Global Stats for summary cards
        const stats = await Transaction.aggregate([
            { $match: { ...query, to: req.user._id, status: 'SUCCESS' } },
            { $group: { _id: null, totalPaid: { $sum: "$usdtAmount" } } }
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
                'E': '[EÈÉẺẼẸÊỀẾỂỄỆ]',
                'I': '[IÌÍỈĨỊ]',
                'O': '[OÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢ]',
                'U': '[UÙÚỦŨỤƯỪỨỬỮỰ]',
                'Y': '[YỲÝỶỸỴ]',
                'D': '[DĐ]'
            };
            let regexStr = str;
            Object.keys(map).forEach(key => {
                regexStr = regexStr.replace(new RegExp(key, 'g'), map[key]);
            });
            return new RegExp(regexStr, 'i');
        };

        const queryRegex = search ? createVietnameseRegex(search) : null;

        let matchQuery = {};
        if (category === 'USDT') {
            matchQuery = { 
                $and: [
                    { $or: [{ symbol: 'USDT' }, { usdtAmount: { $gt: 0 } }] },
                    { type: { $ne: 'COMMISSION' } }
                ]
            };
        } else if (category === 'COMMISSION') {
            matchQuery = { type: 'COMMISSION' };
        } else if (category === 'AQE') {
            matchQuery = { symbol: 'AQE', type: { $ne: 'COMMISSION' } };
        }

        const transactions = await Transaction.aggregate([
            { $match: matchQuery },
            { $sort: { createdAt: -1 } },
            {
                $lookup: {
                    from: "users",
                    let: { fromId: "$from" },
                    pipeline: [
                        { $match: { $expr: { $eq: [{ $toString: "$_id" }, "$$fromId"] } } },
                        { $project: { username: 1, fullName: 1, email: 1 } }
                    ],
                    as: "fromUser"
                }
            },
            {
                $lookup: {
                    from: "users",
                    let: { toId: "$to" },
                    pipeline: [
                        { $match: { $expr: { $eq: [{ $toString: "$_id" }, "$$toId"] } } },
                        { $project: { username: 1, fullName: 1, email: 1 } }
                    ],
                    as: "toUser"
                }
            },
            {
                $set: {
                    from: { $arrayElemAt: ["$fromUser", 0] },
                    to: { $arrayElemAt: ["$toUser", 0] }
                }
            },
            // apply search filter after lookup to search by user name/email too
            {
                $match: {
                    $or: [
                        { hash: { $regex: queryRegex || /./ } },
                        { "from.username": { $regex: queryRegex || /./ } },
                        { "from.fullName": { $regex: queryRegex || /./ } },
                        { "from.email": { $regex: queryRegex || /./ } },
                        { "to.username": { $regex: queryRegex || /./ } },
                        { "to.fullName": { $regex: queryRegex || /./ } },
                        { "to.email": { $regex: queryRegex || /./ } },
                        { description: { $regex: queryRegex || /./ } }
                    ]
                }
            }
        ]);

        const total = transactions.length; // Approximate total after search in memory for now or move to separate facet
        const paginatedTransactions = transactions.slice(skip, skip + limit);

        res.json({
            transactions: paginatedTransactions,
            page,
            pages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
