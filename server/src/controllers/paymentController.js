import crypto from 'crypto';
import mongoose from 'mongoose';
import { ethers } from 'ethers';
import { TokenState } from '../models/Blockchain.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import Commission from '../models/Commission.js';
import Notification from '../models/Notification.js';
import BalanceHistory from '../models/BalanceHistory.js';
import { finalizeBlockchainPayment } from '../services/paymentService.js';
import { emitNotification } from '../utils/socket.js';

// Helper to get current time in Vietnam (GMT+7)
const getVietnamTime = () => {
    return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
};

// @desc    Submit a pledge for Pre-registration
export const submitPreRegisterPledge = async (req, res) => {
    const { pledgeAmount } = req.body;
    try {
        if (pledgeAmount < 100) {
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

        let price = 1.0;
        if (nowVN >= julyFirstVN) {
            const stats = await TokenState.findOne({ symbol: 'AQE' });
            price = stats ? stats.currentPrice : 1.0;
        }

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
        if (!user.pledgeUsdt || user.pledgeUsdt <= 0) return res.json(null);

        const transactions = await Transaction.find({ from: req.user._id, type: 'PAYMENT' }).sort({ createdAt: -1 });

        res.json({
            userId: user._id,
            username: user.username,
            pledgeUsdt: user.pledgeUsdt,
            paidUsdtPreRegister: user.paidUsdtPreRegister,
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

        const total = await Transaction.countDocuments({ from: req.user._id, type: 'PAYMENT', status: 'SUCCESS' });
        const history = await Transaction.find({ from: req.user._id, type: 'PAYMENT', status: 'SUCCESS' })
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

        const paymentId = Math.floor(1000000000 + Math.random() * 9000000000);
        
        const methodText = method === 'QR' ? 'QR Code' : 'Direct Extension';
        const description = `Blockchain Payment (${methodText}). Pledge: ${pledgeAmount || user.pledgeUsdt} USDT`;

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
    const rpcUrl = process.env.ALCHEMY_RPC_URL || process.env.RPC_URL;

    try {
        if (!hash || !paymentId) {
            return res.status(400).json({ message: 'Missing hash or paymentId' });
        }

        if (!rpcUrl) {
            console.error('[ConfirmHash] Missing RPC_URL in environment');
            return res.status(500).json({ message: 'Server configuration error' });
        }

        // Fast-track validation
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        console.log(`[ConfirmHash] Fast-tracking hash: ${hash} for payment: ${paymentId}`);
        
        // Trả về kết quả cho frontend ngay để tránh timeout, việc xử lý hash chạy ngầm
        res.json({ message: 'Processing confirmation...' });

        try {
            let receipt = await provider.getTransactionReceipt(hash);
            if (!receipt) {
                // Nếu chưa có receipt ngay, đợi tối đa 10s
                receipt = await provider.waitForTransaction(hash, 1, 10000); 
            }
            
            if (receipt && receipt.status === 1) {
                const usdtAddress = (process.env.USDT_TOKEN_ADDRESS || "0x55d398326f99059fF775485246999027B3197955").toLowerCase();

                // Lấy số tiền từ log đầu tiên có giá trị (đơn giản hóa)
                const transferLog = receipt.logs.find(l => l.address.toLowerCase() === usdtAddress);
                let amountFromLog = 0;
                if (transferLog) {
                    const valueHex = transferLog.data === "0x" ? transferLog.topics[3] : transferLog.data;
                    amountFromLog = parseFloat(ethers.formatUnits(valueHex, 18));
                }

                console.log(`[ConfirmHash] Verified hash ${hash}. Amount: ${amountFromLog}. Finalizing...`);
                await finalizeBlockchainPayment(Number(paymentId), hash, amountFromLog);
            } else {
                console.error(`[ConfirmHash] Transaction failed on chain: ${hash}`);
            }
        } catch (err) {
            console.error(`[ConfirmHash] Async processing error:`, err);
            // Fallback: Nếu lỗi RPC nhưng frontend đã cam đoan thành công, ta có thể xem xét xử lý sau hoặc log lại
        }
    } catch (error) {
        console.error('[ConfirmHash] Global Error:', error);
        if (!res.headersSent) res.status(500).json({ message: error.message });
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
            ? { status: 'SUCCESS' } 
            : { symbol: req.query.category || 'USDT', status: 'SUCCESS' };

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
