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
async function processCommissions(buyer, totalPledge) {
    if (!buyer.referredBy) return;

    const amountF1 = totalPledge * 0.08;
    const amountF2 = totalPledge * 0.02;

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
            from: user._id,
            to: 'Admin_Wallet',
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
            description: `Payment in ${isLivePhase ? 'Live' : (isPostMay ? 'June' : 'May')} phase`
        });

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
                            from: 'Contract_AQE',
                            to: user._id,
                            amount: bonusTokens,
                            symbol: 'AQE',
                            type: 'REWARD',
                            status: 'SUCCESS',
                            phase,
                            balanceBefore: beforeBonus,
                            balanceAfter: user.preRegisterTokens,
                            description: `Full payment bonus of ${bonusPercent * 100}% on ${user.pledgeUsdt} USDT`
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
                const oldAqeBalance = user.aqeBalance;
                user.aqeBalance += user.preRegisterTokens;
                const releasedTokens = user.preRegisterTokens;
                user.preRegisterTokens = 0;
                user.isPledgeCompleted = true; // Mark as completed to avoid re-triggering commission

                await Transaction.create({
                    hash: '0x' + generateHash('release' + user._id),
                    from: 'Treasury',
                    to: user._id,
                    amount: releasedTokens,
                    symbol: 'AQE',
                    type: 'TRANSFER',
                    status: 'SUCCESS',
                    isReleased: true,
                    balanceBefore: oldAqeBalance,
                    balanceAfter: user.aqeBalance,
                    description: 'Full payment completion release'
                });

                // Mark all unreleased tokens for this user as released (both buys and rewards/bonuses)
                await Transaction.updateMany(
                    { 
                        $or: [{ from: user._id }, { to: user._id }], 
                        isReleased: false, 
                        status: 'SUCCESS' 
                    },
                    { isReleased: true }
                );

                await processCommissions(user, user.pledgeUsdt);
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
                    const oldAqe = user.aqeBalance;
                    user.aqeBalance += user.preRegisterTokens;
                    const releasedAmount = user.preRegisterTokens;
                    user.preRegisterTokens = 0;
                    // Note: We don't mark isPledgeCompleted = true here because they might still hit 100% later
                    // But we release what they have so far.

                    await Transaction.create({
                        hash: '0x' + generateHash('viewCheckpointRelease' + user._id),
                        from: 'Treasury',
                        to: user._id,
                        amount: releasedAmount,
                        symbol: 'AQE',
                        type: 'TRANSFER',
                        status: 'SUCCESS',
                        balanceBefore: oldAqe,
                        balanceAfter: user.aqeBalance,
                        description: 'Monthly checkpoint release (triggered by view)'
                    });
                    
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
        const userId = req.user._id.toString();
        const transactions = await Transaction.find({ 
            $or: [
                { from: userId, type: { $in: ['BUY', 'SELL'] } },
                { to: userId, type: 'REWARD' }
            ]
        }).sort({ createdAt: -1 });

        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
