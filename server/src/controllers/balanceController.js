import Transaction from '../models/Transaction.js';
import Commission from '../models/Commission.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

// @desc    Get current user's commission history
export const getUserCommissions = async (req, res) => {
    try {
        const commissions = await Commission.find({ 
            recipientId: req.user._id 
        })
        .populate('fromUserId', 'firstName lastName username')
        .sort({ createdAt: -1 });

        res.json(commissions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get current user's unified balance history (Ledger)
export const getUserBalanceHistory = async (req, res) => {
    try {
        const userId = req.user._id.toString();
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = {
            $or: [{ from: userId }, { to: userId }],
            type: { $in: ['BUY', 'SELL', 'TRANSFER', 'WITHDRAW', 'DEPOSIT', 'COMMISSION', 'REWARD'] }
        };

        const total = await Transaction.countDocuments(query);
        
        // Fetch paginated transactions with manual lookup
        const transactions = await Transaction.aggregate([
            { $match: query },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
                $lookup: {
                    from: "users",
                    let: { fromId: "$from" },
                    pipeline: [
                        { $match: { $expr: { $eq: [{ $toString: "$_id" }, "$$fromId"] } } },
                        { $project: { username: 1, fullName: 1 } }
                    ],
                    as: "fromUser"
                }
            },
            {
                $lookup: {
                    from: "users",
                    let: { toId: "$to" },
                    pipeline: [
                        { $match: { $expr: { $eq: [{ $toString: "$_id" }, "$$toId"] } } },
                        { $project: { username: 1, fullName: 1 } }
                    ],
                    as: "toUser"
                }
            },
            {
                $addFields: {
                    from: { $arrayElemAt: ["$fromUser", 0] },
                    to: { $arrayElemAt: ["$toUser", 0] }
                }
            }
        ]);

        // 2. Normalize for frontend display
        const history = transactions.map(t => {
            const isOutflow = t.from?._id?.toString() === userId || t.from === userId;
            
            // Determine display description
            let description = t.description;
            if (!description) {
                if (t.type === 'SELL') description = 'Sell AQE for USDT';
                else if (t.type === 'WITHDRAW') description = 'Withdraw to wallet';
                else if (t.type === 'TRANSFER') description = isOutflow ? 'Internal transfer (Out)' : 'Internal transfer (In)';
                else description = 'Wallet transaction';
            }

            return {
                _id: t._id,
                date: t.createdAt,
                type: t.type, 
                symbol: t.symbol || 'USDT',
                category: isOutflow ? 'OUTFLOW' : 'INFLOW',
                amount: t.symbol === 'AQE' ? t.amount : (t.usdtAmount || t.amount),
                status: t.status,
                isReleased: t.isReleased,
                balanceBefore: t.balanceBefore,
                balanceAfter: t.balanceAfter,
                description,
                raw: t
            };
        });

        res.json({
            history,
            page,
            pages: Math.ceil(total / limit),
            total,
            summary: {
                totalPaid: (await Transaction.aggregate([
                    { $match: { to: req.user._id.toString(), type: 'BUY', status: 'SUCCESS' } },
                    { $group: { _id: null, total: { $sum: "$usdtAmount" } } }
                ]))[0]?.total || 0,
                totalAQEOfficial: (await Transaction.aggregate([
                    { $match: { to: req.user._id.toString(), symbol: 'AQE', isReleased: true, status: 'SUCCESS' } },
                    { $group: { _id: null, total: { $sum: "$amount" } } }
                ]))[0]?.total || 0,
                totalAQEEstimated: (await Transaction.aggregate([
                    { $match: { to: req.user._id.toString(), symbol: 'AQE', isReleased: false, status: 'SUCCESS' } },
                    { $group: { _id: null, total: { $sum: "$amount" } } }
                ]))[0]?.total || 0,
                totalCommissions: (await Transaction.aggregate([
                    { $match: { to: req.user._id.toString(), type: 'COMMISSION', status: 'SUCCESS' } },
                    { $group: { _id: null, total: { $sum: { $ifNull: ["$usdtAmount", "$amount"] } } } }
                ]))[0]?.total || 0
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
