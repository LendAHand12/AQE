import BalanceHistory from '../models/BalanceHistory.js';
import Commission from '../models/Commission.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import mongoose from 'mongoose';
import { creditCommission } from '../services/paymentService.js';

// @desc    Get current user's commission history
export const getUserCommissions = async (req, res) => {
    try {
        const commissions = await Commission.find({ 
            recipientId: req.user._id 
        })
        .populate('fromUserId', 'fullName username email')
        .sort({ createdAt: -1 });

        res.json(commissions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Split the user's PENDING commissions into those whose buyer has completed FaceTec (claimable now) and those still blocked
const splitPendingCommissions = async (recipientId) => {
    const pending = await Commission.find({ recipientId, status: 'PENDING' })
        .populate('fromUserId', 'fullName username faceTecTid')
        .sort({ createdAt: -1 });

    const claimable = [];
    const blocked = [];
    for (const c of pending) {
        (c.fromUserId?.faceTecTid ? claimable : blocked).push(c);
    }
    const sum = (list) => list.reduce((s, c) => s + (c.amountUsdt || 0), 0);
    return { claimable, blocked, claimableAmount: sum(claimable), blockedAmount: sum(blocked) };
};

// @desc    Pending commission summary: how much can be claimed now vs. still waiting on the buyer's FaceTec
export const getCommissionSummary = async (req, res) => {
    try {
        const { claimable, blocked, claimableAmount, blockedAmount } = await splitPendingCommissions(req.user._id);
        res.json({
            claimableAmount,
            claimableCount: claimable.length,
            blockedAmount,
            blockedCount: blocked.length,
            pendingAmount: claimableAmount + blockedAmount
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Claim every pending commission whose buyer has completed FaceTec; the rest stay pending
export const claimCommissions = async (req, res) => {
    try {
        const { claimable, blocked } = await splitPendingCommissions(req.user._id);

        let claimedAmount = 0;
        let claimedCount = 0;
        for (const c of claimable) {
            // Atomic PENDING -> CLAIMED so concurrent claims can't credit the same commission twice
            const claimed = await Commission.findOneAndUpdate(
                { _id: c._id, status: 'PENDING' },
                { status: 'CLAIMED', claimedAt: new Date() },
                { new: true }
            );
            if (!claimed) continue;

            await creditCommission(
                req.user._id,
                claimed,
                `Claimed Level ${claimed.level} commission (${claimed.percentage}%) from ${c.fromUserId.username}`
            );
            claimedAmount += claimed.amountUsdt;
            claimedCount += 1;
        }

        if (claimedCount === 0) {
            return res.status(400).json({
                message: blocked.length ? 'assets.commission.error_buyers_not_verified' : 'assets.commission.error_none_pending'
            });
        }

        res.json({
            success: true,
            message: 'assets.commission.claim_success',
            claimedAmount,
            claimedCount,
            stillPendingCount: blocked.length,
            stillPendingAmount: blocked.reduce((s, c) => s + (c.amountUsdt || 0), 0)
        });
    } catch (error) {
        console.error('Claim Commissions Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get current user's token balance history
export const getUserBalanceHistory = async (req, res) => {
    try {
        const userId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const { symbol } = req.query;
        const query = { userId };
        
        if (symbol && symbol !== 'ALL') {
            if (symbol === 'WITHDRAW') {
                query.type = 'WITHDRAW';
            } else {
                query.symbol = symbol;
            }
        }

        const total = await BalanceHistory.countDocuments(query);
        
        const history = await BalanceHistory.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // 1. Fetch current user balances from DB for ground truth
        const user = await User.findById(userId).select('aqeBalance preRegisterTokens usdtBalance');

        // 2. Fetch Summary Stats for Commissions and Payments via Aggregate
        const totalCommissions = await Commission.aggregate([
            // Only commissions actually credited; legacy docs without a status field are treated as paid
            { $match: { recipientId: new mongoose.Types.ObjectId(userId), status: { $ne: 'PENDING' } } },
            { $group: { _id: null, total: { $sum: "$amountUsdt" } } }
        ]);

        const totalPaidUSDT = await Transaction.aggregate([
            { $match: { from: new mongoose.Types.ObjectId(userId), type: 'PAYMENT', status: 'SUCCESS' } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        res.json({
            history,
            page,
            pages: Math.ceil(total / limit),
            total,
            summary: {
                usdtBalance: user.usdtBalance || 0,
                officialAQE: user.aqeBalance || 0,
                temporaryAQE: user.preRegisterTokens || 0,
                totalCommissions: totalCommissions.length > 0 ? totalCommissions[0].total : 0,
                totalPaidUSDT: totalPaidUSDT.length > 0 ? totalPaidUSDT[0].total : 0
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
