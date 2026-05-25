import User from '../models/User.js';
import BalanceHistory from '../models/BalanceHistory.js';
import { TokenState } from '../models/Blockchain.js';

export const getInterestInfo = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            provisionalAqeInterest: user.provisionalAqeInterest || 0,
            claimableAqeInterest: user.claimableAqeInterest || 0,
            firstPaymentDate: user.firstPaymentDate
        });
    } catch (error) {
        console.error('Get Interest Info Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const claimInterest = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const amountToClaim = user.claimableAqeInterest;
        if (!amountToClaim || amountToClaim <= 0) {
            return res.status(400).json({ message: 'Không có lãi AQE nào để nhận (No claimable AQE interest)' });
        }

        // Get AQE Price
        const stats = await TokenState.findOne({ symbol: 'AQE' });
        const price = stats ? stats.currentPrice : 1.0;
        
        const usdtAmount = amountToClaim * price;

        const balanceBefore = user.usdtBalance || 0;
        user.usdtBalance = balanceBefore + usdtAmount;
        user.claimableAqeInterest = 0; // Reset after claiming
        
        await user.save();

        await BalanceHistory.create({
            userId: user._id,
            amount: usdtAmount,
            symbol: 'USDT',
            type: 'CLAIM_INTEREST',
            status: 'SUCCESS',
            isOfficial: true,
            balanceBefore: balanceBefore,
            balanceAfter: user.usdtBalance,
            description: `Claimed ${amountToClaim.toFixed(2)} AQE Interest to ${usdtAmount.toFixed(2)} USDT (Rate: 1 AQE = ${price} USDT)`
        });

        res.json({ 
            success: true, 
            message: 'Nhận lãi thành công / Claim successful', 
            claimedAqe: amountToClaim,
            receivedUsdt: usdtAmount,
            newUsdtBalance: user.usdtBalance
        });
    } catch (error) {
        console.error('Claim Interest Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
