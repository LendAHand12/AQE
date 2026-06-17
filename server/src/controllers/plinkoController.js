import User from '../models/User.js';
import BalanceHistory from '../models/BalanceHistory.js';
import PlinkoHistory from '../models/PlinkoHistory.js';

// Define the Plinko slots (total 9 slots)
const SLOTS = [
    { amount: 100, weight: 25 },
    { amount: 150, weight: 20 },
    { amount: 200, weight: 15 },
    { amount: 300, weight: 12 },
    { amount: 500, weight: 8 },
    { amount: 750, weight: 4 },
    { amount: 1000, weight: 1 }, // jackpot
    { amount: 500, weight: 8 },
    { amount: 200, weight: 15 }
];

// @desc    Get user's Plinko info (plays and recent history)
// @route   GET /api/plinko/info
// @access  Private
export const getPlinkoInfo = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const history = await PlinkoHistory.find({ userId: user._id })
            .sort({ createdAt: -1 })
            .limit(20);

        res.json({
            plinkoPlays: user.plinkoPlays || 0,
            history
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Play Plinko (Drop a ball)
// @route   POST /api/plinko/play
// @access  Private
export const playPlinko = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.plinkoPlays || user.plinkoPlays <= 0) {
            return res.status(400).json({ message: 'No Plinko plays remaining. Deposit 100 USDT to get 10 plays!' });
        }

        // 1. Deduct 1 play
        user.plinkoPlays -= 1;

        // 2. Select slot and reward based on weights
        const totalWeight = SLOTS.reduce((sum, slot) => sum + slot.weight, 0);
        let randomNum = Math.floor(Math.random() * totalWeight);
        let slotIndex = 0;
        
        for (let i = 0; i < SLOTS.length; i++) {
            randomNum -= SLOTS[i].weight;
            if (randomNum < 0) {
                slotIndex = i;
                break;
            }
        }
        
        const rewardAmount = SLOTS[slotIndex].amount;

        // 3. Update user balance (AQE)
        const balanceBefore = user.aqeBalance || 0;
        user.aqeBalance = balanceBefore + rewardAmount;
        await user.save();

        // 4. Create BalanceHistory log
        await BalanceHistory.create({
            userId: user._id,
            amount: rewardAmount,
            symbol: 'AQE',
            type: 'REWARD',
            status: 'SUCCESS',
            isOfficial: true,
            balanceBefore,
            balanceAfter: user.aqeBalance,
            description: `Plinko Game reward: +${rewardAmount} AQE`
        });

        // 5. Create PlinkoHistory log
        const plinkoLog = await PlinkoHistory.create({
            userId: user._id,
            rewardAmount
        });

        res.json({
            success: true,
            rewardAmount,
            slotIndex,
            newPlays: user.plinkoPlays,
            newBalance: user.aqeBalance,
            playedAt: plinkoLog.playedAt
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
