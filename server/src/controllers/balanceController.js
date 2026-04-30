import BalanceHistory from '../models/BalanceHistory.js';
import Commission from '../models/Commission.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import mongoose from 'mongoose';

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

// @desc    Get current user's token balance history
export const getUserBalanceHistory = async (req, res) => {
    try {
        const userId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = { userId };
        const total = await BalanceHistory.countDocuments(query);
        
        const history = await BalanceHistory.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // 1. Fetch current user balances from DB for ground truth
        const user = await User.findById(userId).select('aqeBalance preRegisterTokens');

        // 2. Fetch Summary Stats for Commissions and Payments via Aggregate
        const totalCommissions = await Commission.aggregate([
            { $match: { recipientId: new mongoose.Types.ObjectId(userId) } },
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
