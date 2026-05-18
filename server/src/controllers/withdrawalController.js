import Withdrawal from '../models/Withdrawal.js';
import User from '../models/User.js';
import BalanceHistory from '../models/BalanceHistory.js';
import { sendUsdt } from '../services/blockchainService.js';
import jwt from 'jsonwebtoken';
import Transaction from '../models/Transaction.js';
import mongoose from 'mongoose';
import { sendTelegramNotification } from '../utils/telegramService.js';
import { emitNotification } from '../utils/socket.js';
import Notification from '../models/Notification.js';

/**
 * @desc    Get Withdrawal Verification URL (FaceID)
 * @route   POST /api/withdrawals/request
 * @access  Private
 */
export const requestWithdrawal = async (req, res) => {
    const { walletAddress, zelleInfo, zelleName, paymentMethod = 'WALLET' } = req.body;
    const { user } = req;
    const fee = 1.0;

    try {
        if (paymentMethod === 'WALLET' && !walletAddress) {
            return res.status(400).json({ message: 'withdrawals.errors.wallet_required' });
        }
        if (paymentMethod === 'ZELLE') {
            if (!zelleInfo) return res.status(400).json({ message: 'withdrawals.errors.zelle_required' });
            if (!zelleName) return res.status(400).json({ message: 'Tên tài khoản Zelle là bắt buộc' });
        }

        // 1. Check Balance (Withdraw ALL)
        const withdrawalAmount = user.usdtBalance - fee;
        if (withdrawalAmount < 10) {
            return res.status(400).json({ message: 'withdrawals.errors.insufficient_balance' });
        }

        // 2. Check Prerequisites
        // - FaceID Registered (kycStatus verified and has faceTecTid)
        if (user.kycStatus !== 'verified' || !user.faceTecTid) {
            return res.status(400).json({ message: 'withdrawals.errors.kyc_required' });
        }

        // - Total Paid >= 100 USDT
        const totalPaid = user.paidUsdtPreRegister || 0;
        if (totalPaid < 10) {
            return res.status(400).json({ message: 'withdrawals.errors.min_payment_required' });
        }

        // 3. Generate Callback Token
        const token = jwt.sign(
            { 
                userId: user._id, 
                walletAddress,
                zelleInfo,
                zelleName,
                paymentMethod,
                amount: withdrawalAmount 
            }, 
            process.env.JWT_SECRET || 'secret_key', 
            { expiresIn: '15m' }
        );

        // 4. Generate Facetec Redirect URL
        const callbackUrl = `${process.env.FRONTEND_URL}/user/claim?token=${token}&method=${paymentMethod}`;
        const facetecUrl = `${process.env.FACETEC_BASE_URL}/verify.html?callback=${encodeURIComponent(callbackUrl)}&user_id=${user._id}`;

        res.json({ url: facetecUrl });

    } catch (error) {
        console.error('Withdrawal Request Error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Complete withdrawal after FaceID success
 * @route   POST /api/withdrawals/complete
 * @access  Private
 */
export const completeWithdrawal = async (req, res) => {
    const { token } = req.body;

    try {
        if (!token) {
            return res.status(400).json({ message: 'withdrawals.errors.invalid_token' });
        }

        // 1. Verify Token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
        const { userId, walletAddress, amount, zelleInfo, zelleName, paymentMethod } = decoded;

        if (userId !== req.user._id.toString()) {
            return res.status(403).json({ message: 'withdrawals.errors.invalid_token' });
        }

        const user = await User.findById(userId);
        const withdrawalAmount = parseFloat(amount);
        const fee = 1.0;
        const totalDeduction = withdrawalAmount + fee;

        if (user.usdtBalance < totalDeduction) {
            return res.status(400).json({ message: 'withdrawals.errors.insufficient_balance' });
        }

        // 2. Process Withdrawal (same as before)
        const balanceBefore = user.usdtBalance;
        user.usdtBalance -= totalDeduction;
        await user.save();

        await BalanceHistory.create({
            userId: user._id,
            amount: withdrawalAmount,
            fee: fee,
            symbol: 'USDT',
            type: 'WITHDRAW',
            status: withdrawalAmount <= 200 ? 'SUCCESS' : 'PENDING',
            balanceBefore: balanceBefore,
            balanceAfter: user.usdtBalance,
            description: `USDT withdrawal to ${paymentMethod === 'ZELLE' ? 'Zelle (' + zelleName + ' - ' + zelleInfo + ')' : 'wallet ' + (walletAddress?.substring(0, 6) || '') + '...' + (walletAddress?.substring(walletAddress.length - 4) || '')} (Fee: 1 USDT)`
        });

        const withdrawal = await Withdrawal.create({
            userId: user._id,
            walletAddress: walletAddress,
            zelleInfo: zelleInfo,
            zelleName: zelleName,
            paymentMethod: paymentMethod,
            amount: withdrawalAmount,
            fee: fee,
            symbol: 'USDT',
            method: (paymentMethod === 'WALLET' && withdrawalAmount <= 200) ? 'AUTO' : 'MANUAL',
            status: (paymentMethod === 'WALLET' && withdrawalAmount <= 200) ? 'SUCCESS' : 'PENDING',
            description: `Withdrawal request to ${paymentMethod === 'ZELLE' ? 'Zelle: ' + zelleName + ' (' + zelleInfo + ')' : walletAddress}`
        });

        if (paymentMethod === 'WALLET' && withdrawalAmount <= 200) {
            try {
                const hash = await sendUsdt(walletAddress, withdrawalAmount);
                withdrawal.hash = hash;
                withdrawal.status = 'SUCCESS';
                await withdrawal.save();
                
                return res.json({ 
                    success: true, 
                    message: 'withdrawals.success_auto', 
                    paymentMethod,
                    hash 
                });
            } catch (blockchainError) {
                console.error('Auto Withdrawal Failed:', blockchainError);
                return res.json({ 
                    success: true, 
                    message: 'withdrawals.success_manual_needed',
                    status: 'PENDING' 
                });
            }
        }

        res.json({ 
            success: true, 
            message: paymentMethod === 'ZELLE' ? 'withdrawals.success_manual_zelle' : 'withdrawals.pending_approval', 
            paymentMethod,
            zelleInfo,
            status: 'PENDING' 
        });

        // Send Telegram Notification if Zelle
        if (paymentMethod === 'ZELLE') {
            const teleMsg = `🚀 <b>Yêu cầu Rút tiền Zelle Mới</b>\n\n` +
                `👤 User: @${user.username}\n` +
                `💰 Số tiền: ${withdrawalAmount} USDT\n` +
                `Tên TK: <code>${zelleName}</code>\n` +
                `🏦 Zelle: <code>${zelleInfo}</code>\n\n` +
                `👉 Vui lòng kiểm tra trang quản trị để xử lý.`;
            sendTelegramNotification(teleMsg);
        }

    } catch (error) {
        console.error('Complete Withdrawal Error:', error);
        res.status(400).json({ message: 'withdrawals.errors.invalid_token_or_expired' });
    }
};

/**
 * @desc    Get user withdrawal history
 * @route   GET /api/withdrawals/my-history
 * @access  Private
 */
export const getMyWithdrawalHistory = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const total = await Withdrawal.countDocuments({ userId: req.user._id });
        const history = await Withdrawal.find({ 
            userId: req.user._id
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

        res.json({
            history,
            page,
            pages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Get all pending withdrawals (Admin only)
 * @route   GET /api/admin/withdrawals/pending
 * @access  Private/Admin
 */
export const getPendingWithdrawals = async (req, res) => {
    try {
        const pending = await Withdrawal.find({ 
            status: 'PENDING' 
        }).populate('userId', 'fullName email username').sort({ createdAt: -1 });

        res.json(pending);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Get all withdrawals (Admin only)
 * @route   GET /api/withdrawals/admin/all
 * @access  Private/Admin
 */
export const getAllWithdrawals = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const status = req.query.status;
        const search = req.query.search;

        let query = {};
        if (status) query.status = status;
        
        // Search by wallet address or hash
        if (search) {
            query.$or = [
                { walletAddress: { $regex: search, $options: 'i' } },
                { hash: { $regex: search, $options: 'i' } }
            ];
        }

        const total = await Withdrawal.countDocuments(query);
        const withdrawals = await Withdrawal.find(query)
            .populate('userId', 'fullName email username')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            withdrawals,
            page,
            pages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Approve a withdrawal (Admin only)
 * @route   PUT /api/admin/withdrawals/:id/approve
 * @access  Private/Admin
 */
export const approveWithdrawal = async (req, res) => {
    const { hash } = req.body;
    try {
        const withdrawal = await Withdrawal.findById(req.params.id);
        if (!withdrawal) {
            return res.status(404).json({ message: 'withdrawals.errors.not_found' });
        }

        withdrawal.status = 'SUCCESS';
        if (hash) withdrawal.hash = hash;
        
        // Record Admin Action
        withdrawal.processedBy = req.admin._id;
        withdrawal.processedAt = new Date();
        
        await withdrawal.save();

        // Update BalanceHistory status if found
        await BalanceHistory.findOneAndUpdate(
            { userId: withdrawal.userId, type: 'WITHDRAW', amount: withdrawal.amount, status: 'PENDING' },
            { status: 'SUCCESS' }
        );

        // Notify User
        const approvedTitle = "Withdrawal Approved";
        const approvedMsg = `Your withdrawal request for ${withdrawal.amount} USDT has been successfully approved!`;
        
        await Notification.create({
            userId: withdrawal.userId,
            title: approvedTitle,
            message: approvedMsg
        });
        emitNotification(withdrawal.userId.toString(), {
            title: approvedTitle,
            message: approvedMsg
        });

        res.json({ message: 'withdrawals.approved' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Reject a withdrawal (Admin only)
 * @route   PUT /api/admin/withdrawals/:id/reject
 * @access  Private/Admin
 */
export const rejectWithdrawal = async (req, res) => {
    try {
        const withdrawal = await Withdrawal.findById(req.params.id);
        if (!withdrawal) {
            return res.status(404).json({ message: 'withdrawals.errors.not_found' });
        }

        withdrawal.status = 'FAILED';
        withdrawal.adminNote = req.body?.reason || 'Rejected by Admin';
        
        // Record Admin Action
        withdrawal.processedBy = req.admin._id;
        withdrawal.processedAt = new Date();
        
        await withdrawal.save();

        // Refund user balance
        const user = await User.findById(withdrawal.userId);
        const fee = 1.0;
        const totalRefund = withdrawal.amount + fee;
        
        const balanceBefore = user.usdtBalance;
        user.usdtBalance += totalRefund;
        await user.save();

        // Add refund to balance history
        await BalanceHistory.create({
            userId: user._id,
            amount: totalRefund,
            symbol: 'USDT',
            type: 'REFUND',
            status: 'SUCCESS',
            balanceBefore: balanceBefore,
            balanceAfter: user.usdtBalance,
            description: `Withdrawal Refund (Rejected)`
        });

        // Update original BalanceHistory record to FAILED
        await BalanceHistory.findOneAndUpdate(
            { userId: withdrawal.userId, type: 'WITHDRAW', amount: withdrawal.amount, status: 'PENDING' },
            { status: 'FAILED', adminNote: withdrawal.adminNote }
        );

        // Notify User
        const rejectedTitle = "Withdrawal Rejected";
        const rejectedMsg = `Your withdrawal request for ${withdrawal.amount} USDT has been rejected and refunded. Reason: ${withdrawal.adminNote}`;

        await Notification.create({
            userId: withdrawal.userId,
            title: rejectedTitle,
            message: rejectedMsg
        });
        emitNotification(withdrawal.userId.toString(), {
            title: rejectedTitle,
            message: rejectedMsg
        });

        res.json({ message: 'withdrawals.rejected_refund' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
