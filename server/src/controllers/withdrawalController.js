import Withdrawal from '../models/Withdrawal.js';
import User from '../models/User.js';
import BalanceHistory from '../models/BalanceHistory.js';
import { sendUsdt } from '../services/blockchainService.js';
import jwt from 'jsonwebtoken';
import Transaction from '../models/Transaction.js';
import mongoose from 'mongoose';

/**
 * @desc    Get Withdrawal Verification URL (FaceID)
 * @route   POST /api/withdrawals/request
 * @access  Private
 */
export const requestWithdrawal = async (req, res) => {
    const { walletAddress } = req.body;
    const { user } = req;
    const fee = 1.0;

    try {
        if (!walletAddress) {
            return res.status(400).json({ message: 'withdrawals.errors.wallet_required' });
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
        if (totalPaid < 100) {
            return res.status(400).json({ message: 'withdrawals.errors.min_payment_required' });
        }

        // 3. Generate Callback Token
        const token = jwt.sign(
            { 
                userId: user._id, 
                walletAddress, 
                amount: withdrawalAmount 
            }, 
            process.env.JWT_SECRET || 'secret_key', 
            { expiresIn: '15m' }
        );

        // 4. Generate Facetec Redirect URL
        const callbackUrl = `${process.env.FRONTEND_URL}/user/claim?token=${token}`;
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
        const { userId, walletAddress, amount } = decoded;

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
            description: `USDT withdrawal to wallet ${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)} (Fee: 1 USDT)`
        });

        const withdrawal = await Withdrawal.create({
            userId: user._id,
            walletAddress: walletAddress,
            amount: withdrawalAmount,
            fee: fee,
            symbol: 'USDT',
            method: withdrawalAmount <= 200 ? 'AUTO' : 'MANUAL',
            status: withdrawalAmount <= 200 ? 'SUCCESS' : 'PENDING',
            description: `Withdrawal request to ${walletAddress}`
        });

        if (withdrawalAmount <= 200) {
            try {
                const hash = await sendUsdt(walletAddress, withdrawalAmount);
                withdrawal.hash = hash;
                withdrawal.status = 'SUCCESS';
                await withdrawal.save();
                
                return res.json({ 
                    success: true, 
                    message: 'withdrawals.success_auto', 
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
            message: 'withdrawals.pending_approval', 
            status: 'PENDING' 
        });

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
        await withdrawal.save();

        // Update BalanceHistory status if found
        await BalanceHistory.findOneAndUpdate(
            { userId: withdrawal.userId, type: 'WITHDRAW', amount: withdrawal.amount, status: 'PENDING' },
            { status: 'SUCCESS' }
        );

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
            { status: 'FAILED' }
        );

        res.json({ message: 'withdrawals.rejected_refund' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
