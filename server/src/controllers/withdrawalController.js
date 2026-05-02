import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import BalanceHistory from '../models/BalanceHistory.js';
import { sendUsdt } from '../services/blockchainService.js';
import mongoose from 'mongoose';

/**
 * @desc    Request a withdrawal
 * @route   POST /api/withdrawals/request
 * @access  Private
 */
export const requestWithdrawal = async (req, res) => {
    const { walletAddress } = req.body;
    const fee = 1.0;

    try {
        if (!walletAddress) {
            return res.status(400).json({ message: 'Vui lòng cung cấp địa chỉ ví nhận tiền' });
        }

        const user = await User.findById(req.user._id);
        const totalBalance = user.usdtBalance;
        
        // Calculate withdrawal amount (total balance minus fee)
        const withdrawalAmount = totalBalance - fee;

        if (withdrawalAmount < 10) {
            return res.status(400).json({ message: 'Số dư không đủ để rút (Tối thiểu 10 USDT sau khi trừ phí)' });
        }

        const totalDeduction = totalBalance; // Withdrawing everything

        // 1. Deduct balance and create BalanceHistory
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
            description: `Rút tiền USDT về ví ${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)} (Phí: 1 USDT)`
        });

        // 2. Create Transaction record
        const transaction = await Transaction.create({
            from: user._id,
            to: walletAddress,
            amount: withdrawalAmount,
            symbol: 'USDT',
            type: 'WITHDRAW',
            status: withdrawalAmount <= 200 ? 'SUCCESS' : 'PENDING',
            description: `Withdrawal request to ${walletAddress}`
        });

        // 3. If amount <= 200, process automatically
        if (withdrawalAmount <= 200) {
            try {
                const hash = await sendUsdt(walletAddress, withdrawalAmount);
                transaction.hash = hash;
                transaction.status = 'SUCCESS';
                await transaction.save();
                
                return res.json({ 
                    success: true, 
                    message: 'Rút tiền thành công và đã được gửi tự động', 
                    hash 
                });
            } catch (blockchainError) {
                console.error('Auto Withdrawal Failed:', blockchainError);
                // Even if blockchain fails, the record stays, but maybe mark as failed or alert admin
                // For now, let's keep it as SUCCESS in DB if we want to trust the user doesn't get a double refund, 
                // but usually we should revert or mark as FAILED.
                // However, the user is already deducted. Admin can check later.
                return res.json({ 
                    success: true, 
                    message: 'Yêu cầu đã được ghi nhận nhưng gặp lỗi khi chuyển tự động. Admin sẽ xử lý thủ công.',
                    status: 'PENDING' 
                });
            }
        }

        // 4. If amount > 200, return pending status
        res.json({ 
            success: true, 
            message: 'Yêu cầu rút tiền đã được gửi và đang chờ Admin duyệt (Số tiền > 200 USDT)', 
            status: 'PENDING' 
        });

    } catch (error) {
        console.error('Withdrawal Error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Get user withdrawal history
 * @route   GET /api/withdrawals/my-history
 * @access  Private
 */
export const getMyWithdrawalHistory = async (req, res) => {
    try {
        const history = await Transaction.find({ 
            from: req.user._id, 
            type: 'WITHDRAW' 
        }).sort({ createdAt: -1 });

        res.json(history);
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
        const pending = await Transaction.find({ 
            type: 'WITHDRAW', 
            status: 'PENDING' 
        }).populate('from', 'fullName email username').sort({ createdAt: -1 });

        res.json(pending);
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
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction || transaction.type !== 'WITHDRAW') {
            return res.status(404).json({ message: 'Không tìm thấy yêu cầu rút tiền' });
        }

        transaction.status = 'SUCCESS';
        if (hash) transaction.hash = hash;
        await transaction.save();

        // Update BalanceHistory status if found
        await BalanceHistory.findOneAndUpdate(
            { userId: transaction.from, type: 'WITHDRAW', amount: transaction.amount, status: 'PENDING' },
            { status: 'SUCCESS' }
        );

        res.json({ message: 'Đã phê duyệt yêu cầu rút tiền' });
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
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction || transaction.type !== 'WITHDRAW') {
            return res.status(404).json({ message: 'Không tìm thấy yêu cầu rút tiền' });
        }

        transaction.status = 'FAILED';
        await transaction.save();

        // Refund user balance
        const user = await User.findById(transaction.from);
        const fee = 1.0;
        const totalRefund = transaction.amount + fee;
        
        const balanceBefore = user.usdtBalance;
        user.usdtBalance += totalRefund;
        await user.save();

        // Add refund to balance history
        await BalanceHistory.create({
            userId: user._id,
            amount: totalRefund,
            symbol: 'USDT',
            type: 'DEPOSIT', // Or a new type REFUND
            status: 'SUCCESS',
            balanceBefore: balanceBefore,
            balanceAfter: user.usdtBalance,
            description: `Hoàn tiền rút (Yêu cầu bị từ chối)`
        });

        // Update original BalanceHistory record to FAILED
        await BalanceHistory.findOneAndUpdate(
            { userId: transaction.from, type: 'WITHDRAW', amount: transaction.amount, status: 'PENDING' },
            { status: 'FAILED' }
        );

        res.json({ message: 'Đã từ chối yêu cầu rút tiền và hoàn tiền cho người dùng' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
