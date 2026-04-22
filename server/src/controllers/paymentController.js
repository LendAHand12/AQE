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

        // 3. Create Ledger Entry (Transaction) for Balance History
        await Transaction.create({
            hash: '0x' + generateHash('commF1' + buyer._id),
            from: buyer._id, // Source of commission
            to: f1._id,      // Recipient
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
    const { totalPledgeUsdt } = req.body;
    try {
        if (totalPledgeUsdt < 100) {
            return res.status(400).json({ message: 'Số tiền đăng ký mua tối thiểu là 100 USDT' });
        }

        const user = await User.findById(req.user._id);
        if (user.pledgeUsdt > 0 && user.paidUsdtPreRegister > 0) {
            return res.status(400).json({ message: 'Bạn không thể thay đổi số tiền cam kết sau khi đã thực hiện thanh toán' });
        }

        user.pledgeUsdt = totalPledgeUsdt;
        await user.save();

        res.json({ message: 'Đăng ký số tiền mua sớm thành công', pledgeUsdt: user.pledgeUsdt });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Handle Actual Payment via WalletConnect
export const submitPreRegisterPayment = async (req, res) => {
    const { hash, amountUsdt, totalPledgeUsdt } = req.body;
    try {
        const user = await User.findById(req.user._id);

        if (user.kycStatus !== 'verified') {
            return res.status(403).json({ message: 'Bạn cần hoàn thành và được duyệt KYC bước 1 để thực hiện thanh toán' });
        }

        if (!user.pledgeUsdt || user.pledgeUsdt <= 0) {
            if (!totalPledgeUsdt || totalPledgeUsdt < 100) {
                return res.status(400).json({ message: 'Số tiền đăng ký mua tối thiểu là 100 USDT' });
            }
            if (amountUsdt < (totalPledgeUsdt * 0.3)) {
                return res.status(400).json({ message: `Lần thanh toán đầu tiên phải tối thiểu 30% (${(totalPledgeUsdt * 0.3).toLocaleString()} USDT)` });
            }
            user.pledgeUsdt = totalPledgeUsdt;
        }

        if (user.paidUsdtPreRegister === 0 && amountUsdt < (user.pledgeUsdt * 0.3)) {
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

        const tokensCalculated = amountUsdt / price;
        const oldPreRegisterTokens = user.preRegisterTokens;

        await Transaction.create({
            hash,
            from: user._id,
            to: 'Admin_Wallet',
            amount: tokensCalculated,
            usdtAmount: amountUsdt,
            priceAtTime: price,
            phase,
            symbol: 'AQE',
            type: 'BUY',
            status: 'SUCCESS',
            balanceBefore: oldPreRegisterTokens,
            balanceAfter: oldPreRegisterTokens + tokensCalculated
        });

        user.paidUsdtPreRegister += amountUsdt;
        user.preRegisterTokens += tokensCalculated;

        if (user.paidUsdtPreRegister >= user.pledgeUsdt) {
            if (!user.hasReceivedPromotion) {
                let bonusPercent = 0;
                if (nowVN <= may31VN) bonusPercent = 0.10;
                else if (nowVN <= june30VN) bonusPercent = 0.05;

                if (bonusPercent > 0) {
                    const oldPreRegisterTokensWithBonus = user.preRegisterTokens;
                    const bonusTokens = user.preRegisterTokens * bonusPercent;
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
                        balanceBefore: oldPreRegisterTokensWithBonus,
                        balanceAfter: user.preRegisterTokens,
                        description: `Early payment bonus reward of ${bonusPercent * 100}%`
                    });

                    const bonusNotif = await Notification.create({
                        userId: user._id,
                        title: 'Bonus Reward Received',
                        message: `Congratulations! You have received a ${bonusPercent * 100}% AQE Token bonus for early payment.`,
                        type: 'REWARD',
                        isRead: false
                    });
                    emitNotification(user._id, bonusNotif);
                }
            }

            const completionNotif = await Notification.create({
                userId: user._id,
                title: 'Pre-registration Payment Completed',
                message: 'Congratulations! You have successfully completed 100% of your pre-registration payment. Your tokens have been credited to your balance.',
                type: 'PAYMENT',
                isRead: false
            });
            emitNotification(user._id, completionNotif);

            user.aqeBalance += user.preRegisterTokens;
            await processCommissions(user, user.pledgeUsdt);
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
        const user = await User.findById(req.user._id).select('username pledgeUsdt paidUsdtPreRegister preRegisterTokens hasReceivedPromotion');
        
        // Return null if no pledge made
        if (!user.pledgeUsdt || user.pledgeUsdt <= 0) return res.json(null);

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
