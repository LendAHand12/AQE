import Transaction from '../models/Transaction.js';
import Commission from '../models/Commission.js';

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

        // 1. Fetch all transactions related to this user in the Ledger (Transaction model)
        // Includes: COMMISSION, REWARD, SELL, TRANSFER, WITHDRAW, DEPOSIT
        const transactions = await Transaction.find({
            $or: [{ from: userId }, { to: userId }],
            type: { $in: ['BUY', 'SELL', 'TRANSFER', 'WITHDRAW', 'DEPOSIT', 'COMMISSION', 'REWARD'] }
        })
        .populate('from', 'username fullName')
        .populate('to', 'username fullName')
        .sort({ createdAt: -1 })
        .lean();

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
