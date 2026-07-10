import User from '../models/User.js';
import BalanceHistory from '../models/BalanceHistory.js';
import PlinkoHistory from '../models/PlinkoHistory.js';
import PlinkoSettings from '../models/PlinkoSettings.js';
import AdminLog from '../models/AdminLog.js';

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

        let settings = await PlinkoSettings.findOne();
        if (!settings) {
            settings = await PlinkoSettings.create({});
        }

        res.json({
            plinkoPlays: user.plinkoPlays || 0,
            history,
            settings
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

        // Fetch Plinko Settings
        let settings = await PlinkoSettings.findOne();
        if (!settings) {
            settings = await PlinkoSettings.create({});
        }

        const slots = settings.slots;
        if (!slots || slots.length === 0) {
            return res.status(500).json({ message: 'Plinko slots configuration is empty' });
        }

        // 1. Deduct 1 play
        user.plinkoPlays -= 1;

        // 2. Select slot and reward based on weights
        const totalWeight = slots.reduce((sum, slot) => sum + slot.weight, 0);
        let randomNum = Math.floor(Math.random() * totalWeight);
        let slotIndex = 0;
        
        for (let i = 0; i < slots.length; i++) {
            randomNum -= slots[i].weight;
            if (randomNum < 0) {
                slotIndex = i;
                break;
            }
        }
        
        const rewardAmount = slots[slotIndex].amount;

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

// @desc    Get Plinko settings (Admin)
// @route   GET /api/admin/plinko-settings
// @access  Private
export const getPlinkoSettingsAdmin = async (req, res) => {
    try {
        let settings = await PlinkoSettings.findOne();
        if (!settings) {
            settings = await PlinkoSettings.create({});
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update Plinko settings (Admin)
// @route   PUT /api/admin/plinko-settings
// @access  Private
export const updatePlinkoSettingsAdmin = async (req, res) => {
    const { engineGravity, frictionAir, vxMultiplier, slots } = req.body;
    try {
        let settings = await PlinkoSettings.findOne();
        if (!settings) {
            settings = new PlinkoSettings();
        }

        settings.engineGravity = engineGravity !== undefined ? Number(engineGravity) : settings.engineGravity;
        settings.frictionAir = frictionAir !== undefined ? Number(frictionAir) : settings.frictionAir;
        settings.vxMultiplier = vxMultiplier !== undefined ? Number(vxMultiplier) : settings.vxMultiplier;
        
        if (slots && Array.isArray(slots)) {
            settings.slots = slots;
        }

        const updatedSettings = await settings.save();

        // Log the action
        await AdminLog.create({
            adminId: req.admin._id,
            adminUsername: req.admin.username,
            action: 'UPDATE_PLINKO_SETTINGS',
            target: 'PLINKO',
            details: req.body
        });

        res.json({ message: 'Cập nhật cài đặt Plinko thành công', settings: updatedSettings });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
