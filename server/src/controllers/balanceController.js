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

        // 1. Fetch all transactions related to this user with manual lookup since IDs are now strings
        const transactions = await Transaction.aggregate([
            {
                $match: {
                    $or: [{ from: userId }, { to: userId }],
                    type: { $in: ['BUY', 'SELL', 'TRANSFER', 'WITHDRAW', 'DEPOSIT', 'COMMISSION', 'REWARD'] }
                }
            },
            { $sort: { createdAt: -1 } },
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
                type: t.type, // COMMISSION, REWARD, SELL, etc.
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

        res.json(history);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
