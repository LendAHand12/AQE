import crypto from 'crypto';
import mongoose from 'mongoose';
import { ethers } from 'ethers';
import { TokenState } from '../models/Blockchain.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import Commission from '../models/Commission.js';
import Notification from '../models/Notification.js';
import BalanceHistory from '../models/BalanceHistory.js';
import { finalizeBlockchainPayment, processCommissions } from '../services/paymentService.js';
import { emitNotification } from '../utils/socket.js';
import { sendTelegramNotification } from '../utils/telegramService.js';

// Helper to get current time in Vietnam (GMT+7)
const getVietnamTime = () => {
    return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
};

// @desc    Submit a pledge for Pre-registration
export const submitPreRegisterPledge = async (req, res) => {
    const { pledgeAmount } = req.body;
    try {
        if (pledgeAmount < 10) {
            return res.status(400).json({ message: 'payments.errors.min_pledge' });
        }

        const user = await User.findById(req.user._id);

        if (user.pledgeUsdt > 0) {
            if (!user.isPledgeCompleted) {
                if (user.paidUsdtPreRegister > 0) {
                    return res.status(400).json({ message: 'payments.errors.cannot_change_pledge' });
                }
                user.pledgeUsdt = pledgeAmount;
            } else {
                user.pledgeRounds.push({
                    roundNumber: user.pledgeRounds.length + 1,
                    pledgeUsdt: user.pledgeUsdt,
                    paidUsdt: user.paidUsdtPreRegister,
                    tokensReceived: user.preRegisterTokens,
                    bonusPercent: user.hasReceivedPromotion ? (new Date() <= new Date('2026-05-31') ? 0.10 : 0.05) : 0,
                    completedAt: new Date()
                });

                user.pledgeUsdt = pledgeAmount;
                user.paidUsdtPreRegister = 0;
                user.preRegisterTokens = 0;
                user.hasReceivedPromotion = false;
                user.isPledgeCompleted = false;
            }
        } else {
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
        const julyFirstVN = new Date('2026-07-01T00:00:00+07:00');

        if (user.kycStatus !== 'verified' && user.kycStatus !== 'pending') {
            return res.status(403).json({ message: 'payments.errors.kyc_required' });
        }

        if (!user.pledgeUsdt || user.pledgeUsdt <= 0 || user.isPledgeCompleted) {
            if (user.isPledgeCompleted) {
                user.pledgeRounds.push({
                    roundNumber: user.pledgeRounds.length + 1,
                    pledgeUsdt: user.pledgeUsdt,
                    paidUsdt: user.paidUsdtPreRegister,
                    tokensReceived: user.preRegisterTokens,
                    bonusPercent: user.hasReceivedPromotion ? (nowVN <= may31VN ? 0.10 : 0.05) : 0,
                    completedAt: new Date()
                });
                user.paidUsdtPreRegister = 0;
                user.preRegisterTokens = 0;
                user.hasReceivedPromotion = false;
                user.isPledgeCompleted = false;
            }

            if (!pledgeAmountNum || pledgeAmountNum < 100) {
                return res.status(400).json({ message: 'payments.errors.min_pledge' });
            }
            user.pledgeUsdt = pledgeAmountNum;
        }

        // Pegged rate: 1 AQE = 1 USDT (not related to pool price yet)
        const price = 1.0;

        const tokensCalculated = amountNum / price;

        await Transaction.create({
            hash,
            from: user._id,
            to: 'System',
            amount: amountNum,
            symbol: 'USDT',
            type: 'PAYMENT',
            status: 'SUCCESS',
            description: `Payment for AQE`
        });

        if (nowVN >= julyFirstVN) {
            user.aqeBalance += tokensCalculated;
        } else {
            user.paidUsdtPreRegister += amountNum;
            user.preRegisterTokens += tokensCalculated;

            if (user.paidUsdtPreRegister >= user.pledgeUsdt && !user.isPledgeCompleted) {
                user.isPledgeCompleted = true;

                let bonusPercent = 0;
                if (nowVN <= may31VN) {
                    bonusPercent = 0.10;
                } else if (nowVN < julyFirstVN) {
                    bonusPercent = 0.05;
                }

                const bonusTokens = user.preRegisterTokens * bonusPercent;
                const totalTokens = user.preRegisterTokens + bonusTokens;

                user.aqeBalance += totalTokens;
                user.preRegisterTokens = 0;
                user.hasReceivedPromotion = true;

                if (bonusTokens > 0) {
                    await BalanceHistory.create({
                        userId: user._id,
                        amount: bonusTokens,
                        symbol: 'AQE',
                        type: 'REWARD',
                        status: 'SUCCESS',
                        isOfficial: true,
                        balanceBefore: user.aqeBalance - bonusTokens,
                        balanceAfter: user.aqeBalance,
                        description: `Bonus ${bonusPercent * 100}% for completing pledge`
                    });
                }

                // Convert all previous AQE balance history records to official
                await BalanceHistory.updateMany(
                    { userId: user._id, symbol: 'AQE', status: 'SUCCESS', isOfficial: false },
                    { isOfficial: true }
                );
            }
        }

        await user.save();
        res.json({ message: 'payments.payment_success' });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get current user's pre-register status
export const getMyPreRegister = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        const transactions = await Transaction.find({
            from: req.user._id,
            type: 'PAYMENT',
            status: { $in: ['SUCCESS', 'AWAITING_APPROVAL'] }
        }).sort({ createdAt: -1 });

        const awaitingApprovalAmount = transactions
            .filter(t => t.status === 'AWAITING_APPROVAL')
            .reduce((sum, t) => sum + (t.amount || 0), 0);

        if (!user.pledgeUsdt || user.pledgeUsdt <= 0) {
            if (awaitingApprovalAmount > 0) {
                return res.json({
                    userId: user._id,
                    username: user.username,
                    pledgeUsdt: 0,
                    paidUsdtPreRegister: 0,
                    awaitingApprovalAmount,
                    preRegisterTokens: 0,
                    status: 'pending',
                    transactions: transactions
                });
            }
            return res.json(null);
        }

        res.json({
            userId: user._id,
            username: user.username,
            pledgeUsdt: user.pledgeUsdt,
            paidUsdtPreRegister: user.paidUsdtPreRegister,
            awaitingApprovalAmount,
            preRegisterTokens: user.preRegisterTokens,
            status: user.paidUsdtPreRegister >= user.pledgeUsdt ? 'completed' : 'pending',
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
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = {
            from: req.user._id,
            type: 'PAYMENT',
            status: { $in: ['SUCCESS', 'AWAITING_APPROVAL'] }
        };

        const total = await Transaction.countDocuments(query);
        const history = await Transaction.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Calculate summary
        const totalPaid = await Transaction.aggregate([
            { $match: { from: new mongoose.Types.ObjectId(req.user._id), type: 'PAYMENT', status: 'SUCCESS' } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        res.json({
            transactions: history,
            page,
            pages: Math.ceil(total / limit),
            total,
            summary: {
                totalPaid: totalPaid.length > 0 ? totalPaid[0].total : 0
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new payment for QR flow
export const createPayment = async (req, res) => {
    const { amount, pledgeAmount, method } = req.body;
    try {
        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Invalid amount' });
        }

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Check for pending manual payments
        const existingAwaiting = await Transaction.findOne({ from: req.user._id, status: 'AWAITING_APPROVAL' });
        if (existingAwaiting) {
            return res.status(400).json({ message: 'payments.pending_manual_exists' });
        }

        const paymentId = Math.floor(1000000000 + Math.random() * 9000000000);

        const methodText = method === 'QR' ? 'QR Code' : (method === 'ZELLE' ? 'Zelle' : 'Direct Extension');
        const description = `${method === 'ZELLE' ? 'Manual Payment' : 'Blockchain Payment'} (${methodText}). Pledge: ${pledgeAmount || user.pledgeUsdt} USDT`;

        const transaction = await Transaction.create({
            paymentId,
            from: req.user._id,
            to: process.env.ADMIN_WALLET_ADDRESS,
            amount,
            symbol: 'USDT',
            type: 'PAYMENT',
            status: 'PENDING',
            description,
            metadata: { pledgeAmount: pledgeAmount || user.pledgeUsdt, method }
        });

        const qrUrl = `${process.env.FRONTEND_URL}/pay?pid=${paymentId}`;

        res.json({
            paymentId,
            amount,
            qrUrl,
            transactionId: transaction._id
        });
    } catch (error) {
        console.error('[CreatePayment] Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get payment info by paymentId
export const getPaymentById = async (req, res) => {
    const { paymentId } = req.params;
    try {
        const transaction = await Transaction.findOne({ paymentId })
            .populate('from', 'username fullName email');

        if (!transaction) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        res.json(transaction);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user payment history
export const getPaymentHistory = async (req, res) => {
    try {
        const history = await Transaction.find({
            from: req.user._id,
            type: 'PAYMENT',
            status: 'SUCCESS'
        }).sort({ createdAt: -1 });

        res.json(history);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Manually confirm a transaction hash for instant UX
export const confirmTransactionHash = async (req, res) => {
    const { paymentId, hash } = req.body;

    try {
        if (!hash || !paymentId) {
            return res.status(400).json({ message: 'Missing hash or paymentId' });
        }

        const transaction = await Transaction.findOne({ paymentId });
        if (!transaction) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        if (transaction.status !== 'PENDING') {
            return res.status(400).json({ message: 'Transaction is already processed' });
        }

        console.log(`[ConfirmHash] Auto-finalizing hash ${hash} for payment ${paymentId} (Instant Success)`);

        // Auto-finalize without checking blockchain
        // Use the amount from the transaction record since we're not checking the chain
        await finalizeBlockchainPayment(Number(paymentId), hash, transaction.amount);

        return res.json({
            message: 'Payment confirmed successfully',
            status: 'SUCCESS'
        });

    } catch (error) {
        console.error('[ConfirmHash] Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    User confirms they have paid via manual method (Zelle)
export const confirmManualPayment = async (req, res) => {
    const { paymentId } = req.body;
    try {
        const transaction = await Transaction.findOne({ paymentId, from: req.user._id });
        if (!transaction) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        if (transaction.status !== 'PENDING') {
            return res.status(400).json({ message: 'Transaction is already processed' });
        }

        transaction.status = 'AWAITING_APPROVAL';
        await transaction.save();

        const user = await User.findById(req.user._id);

        // Notify Admin via Telegram
        const telegramMsg = `
🚀 <b>New Manual Payment Submission</b>
━━━━━━━━━━━━━━━━━━━━━━━━
👤 <b>User:</b> ${user.fullName} (@${user.username})
💰 <b>Amount:</b> ${transaction.amount} ${transaction.symbol}
🆔 <b>Payment ID:</b> <code>${paymentId}</code>
📝 <b>Method:</b> Zelle
⏰ <b>Time:</b> ${getVietnamTime().toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━━━━
<i>Please check the admin dashboard to verify and approve this transaction.</i>`;

        await sendTelegramNotification(telegramMsg);

        res.json({
            message: 'payments.manual_confirm_success',
            status: 'AWAITING_APPROVAL'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Admin Approve Manual Payment
export const approveManualPayment = async (req, res) => {
    try {
        const { paymentId } = req.body;
        const transaction = await Transaction.findOne({ paymentId, status: 'AWAITING_APPROVAL' });

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found or already processed' });
        }

        const user = await User.findById(transaction.from);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Handle New Pledge Round if previous was completed
        if (transaction.metadata?.pledgeAmount && (!user.pledgeUsdt || user.pledgeUsdt <= 0 || user.isPledgeCompleted)) {
            if (user.isPledgeCompleted) {
                user.pledgeRounds.push({
                    roundNumber: user.pledgeRounds.length + 1,
                    pledgeUsdt: user.pledgeUsdt,
                    paidUsdt: user.paidUsdtPreRegister,
                    tokensReceived: user.preRegisterTokens,
                    bonusPercent: 0,
                    completedAt: new Date()
                });
                user.paidUsdtPreRegister = 0;
                user.preRegisterTokens = 0;
                user.isPledgeCompleted = false;
            }
            user.pledgeUsdt = transaction.metadata.pledgeAmount;
        }

        // --- SHARED FINALIZE LOGIC ---
        const nowVN = getVietnamTime();
        const may31VN = new Date('2026-05-31T23:59:59+07:00');
        const julyFirstVN = new Date('2026-07-01T00:00:00+07:00');

        let price = 1.0;
        const tokensCalculated = transaction.amount / price;

        // Update Transaction
        transaction.status = 'SUCCESS';
        transaction.description = transaction.description + ` (Approved by ${req.admin.username})`;
        transaction.hash = `Approved by ${req.admin.username} at ${nowVN.toLocaleString('vi-VN')}`;
        await transaction.save();

        // Update User Profile
        user.paidUsdtPreRegister += transaction.amount;
        user.preRegisterTokens += tokensCalculated;

        // Log Token Receipt
        await BalanceHistory.create({
            userId: user._id,
            amount: tokensCalculated,
            symbol: 'AQE',
            type: 'RECEIVE',
            status: 'SUCCESS',
            isOfficial: false,
            balanceBefore: user.aqeBalance + (user.preRegisterTokens - tokensCalculated),
            balanceAfter: user.aqeBalance + user.preRegisterTokens,
            description: `Manual Payment Approved (Zelle)`
        });

        // Auto-complete pledge if reached
        if (user.pledgeUsdt > 0 && user.paidUsdtPreRegister >= user.pledgeUsdt && !user.isPledgeCompleted) {
            user.isPledgeCompleted = true;

            let bonusPercent = 0;
            if (nowVN <= may31VN) bonusPercent = 0.10;
            else if (nowVN < julyFirstVN) bonusPercent = 0.05;

            const bonusTokens = user.preRegisterTokens * bonusPercent;
            user.aqeBalance += (user.preRegisterTokens + bonusTokens);
            user.preRegisterTokens = 0;
            user.hasReceivedPromotion = true;

            if (bonusTokens > 0) {
                await BalanceHistory.create({
                    userId: user._id,
                    amount: bonusTokens,
                    symbol: 'AQE',
                    type: 'REWARD',
                    status: 'SUCCESS',
                    isOfficial: true,
                    balanceBefore: user.aqeBalance - bonusTokens,
                    balanceAfter: user.aqeBalance,
                    description: `Bonus ${bonusPercent * 100}% for completing pledge`
                });
            }

            // Convert all previous AQE balance history records to official
            await BalanceHistory.updateMany(
                { userId: user._id, symbol: 'AQE', status: 'SUCCESS', isOfficial: false },
                { isOfficial: true }
            );
        }
        await user.save();

        // Process Commissions
        await processCommissions(user, transaction.amount);

        // Notify User
        await Notification.create({
            userId: user._id,
            title: 'Payment Approved',
            message: `Your manual payment of ${transaction.amount} USDT has been approved.`,
            type: 'PAYMENT'
        });
        emitNotification(user._id, {
            title: 'notifications.payment_approved_title',
            message: 'notifications.payment_approved_msg',
            messageParams: { amount: transaction.amount, paymentId: paymentId },
            type: 'PAYMENT',
            paymentId: paymentId
        });

        res.json({ message: 'Transaction approved successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Admin Reject Manual Payment
export const rejectManualPayment = async (req, res) => {
    try {
        const { paymentId, reason } = req.body;
        const transaction = await Transaction.findOne({ paymentId, status: 'AWAITING_APPROVAL' });

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        transaction.status = 'FAILED';
        transaction.description = `Rejected by Admin: ${reason || 'Invalid details'}`;
        await transaction.save();

        // Notify User
        await Notification.create({
            userId: transaction.from,
            title: 'Payment Rejected',
            message: `Your manual payment #${paymentId} was rejected. Reason: ${reason || 'Invalid details'}`,
            type: 'PAYMENT'
        });
        emitNotification(transaction.from, {
            title: 'notifications.payment_rejected_title',
            message: 'notifications.payment_rejected_msg',
            messageParams: { paymentId: paymentId, reason: reason || 'Invalid' },
            type: 'PAYMENT',
            paymentId: paymentId
        });

        res.json({ message: 'Transaction rejected' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get ALL transactions (Admin only)
export const getAllTransactionsForAdmin = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';

        let query = req.query.category === 'ALL'
            ? { status: { $in: ['SUCCESS', 'AWAITING_APPROVAL'] } }
            : { symbol: req.query.category || 'USDT', status: { $in: ['SUCCESS', 'AWAITING_APPROVAL'] } };

        if (search) {
            // Find users matching search first if we want to search by username/fullName
            const users = await User.find({
                $or: [
                    { username: { $regex: search, $options: 'i' } },
                    { fullName: { $regex: search, $options: 'i' } }
                ]
            }).select('_id');
            const userIds = users.map(u => u._id);

            query.$or = [
                { hash: { $regex: search, $options: 'i' } },
                { from: { $in: userIds } },
                { to: { $in: userIds } }
            ];
        }

        const total = await Transaction.countDocuments(query);
        const transactions = await Transaction.find(query)
            .populate('from', 'username fullName email')
            .populate('to', 'username fullName email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            transactions,
            page,
            pages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get ALL commissions (Admin only)
export const getAllCommissionsForAdmin = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';

        let query = {};

        if (search) {
            const users = await User.find({
                $or: [
                    { username: { $regex: search, $options: 'i' } },
                    { fullName: { $regex: search, $options: 'i' } }
                ]
            }).select('_id');
            const userIds = users.map(u => u._id);

            query.$or = [
                { fromUserId: { $in: userIds } },
                { recipientId: { $in: userIds } }
            ];
        }

        const total = await Commission.countDocuments(query);
        const commissionsRaw = await Commission.find(query)
            .populate('fromUserId', 'username fullName email')
            .populate('recipientId', 'username fullName email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Map to match frontend expectations
        const transactions = commissionsRaw.map(c => ({
            _id: c._id,
            from: c.fromUserId,
            to: c.recipientId,
            amount: c.amountUsdt,
            salesAmount: c.salesAmount,
            description: `Level ${c.level} Commission (${c.percentage}%)`,
            createdAt: c.createdAt
        }));

        res.json({
            transactions,
            page,
            pages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
