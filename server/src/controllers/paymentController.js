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
                user.aqeBalance += user.preRegisterTokens;
                user.preRegisterTokens = 0;
                user.isPledgeCompleted = true;
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

        res.json({ message: 'Processing confirmation...' });

        // Fast-track validation
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const receipt = await provider.waitForTransaction(hash, 1);
        
        if (receipt && receipt.status === 1) {
            const depositTopic = "0xdcbc1c05240f31ff3ad067ef1ee35ce4997762752e3a095284754544f4c709d7";
            const transferTopic = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
            const usdtAddress = (process.env.USDT_TOKEN_ADDRESS || "0x55d398326f99059fF775485246999027B3197955").toLowerCase();
            const adminAddress = (process.env.ADMIN_WALLET_ADDRESS).toLowerCase();

            // 1. Check for Smart Contract Deposit Event
            const depositLog = receipt.logs.find(l => 
                l.topics[0] === depositTopic && 
                l.address.toLowerCase() === (process.env.PAYMENT_CONTRACT_ADDRESS || "").toLowerCase()
            );
            
            if (depositLog) {
                const iface = new ethers.Interface([
                    "event Deposit(address indexed from, address indexed to, uint256 amount, uint256 paymentId)"
                ]);
                const parsedLog = iface.parseLog(depositLog);
                const eventPaymentId = Number(parsedLog.args.paymentId);
                const eventAmount = parseFloat(ethers.formatUnits(parsedLog.args.amount, 18));

                if (eventPaymentId === Number(paymentId)) {
                    await finalizeBlockchainPayment(eventPaymentId, hash, eventAmount);
                    return;
                }
            }

            // 2. Check for Direct USDT Transfer Event (Legacy/Extension Flow)
            const transferLog = receipt.logs.find(l => 
                l.topics[0] === transferTopic && 
                l.address.toLowerCase() === usdtAddress
            );

            if (transferLog) {
                const iface = new ethers.Interface([
                    "event Transfer(address indexed from, address indexed to, uint256 value)"
                ]);
                const parsedLog = iface.parseLog(transferLog);
                const recipient = parsedLog.args.to.toLowerCase();
                const eventAmount = parseFloat(ethers.formatUnits(parsedLog.args.value, 18));

                // Verify recipient is admin and amount matches (or at least valid)
                if (recipient === adminAddress) {
                    await finalizeBlockchainPayment(Number(paymentId), hash, eventAmount);
                }
            }
        }
    } catch (error) {
        console.error('[ConfirmHash] Error:', error);
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
