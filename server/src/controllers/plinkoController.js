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
            settings: {
                ...settings.toObject(),
                initialJackpot: settings.initialJackpot || 1000,
                targetJackpot: settings.targetJackpot || 5000,
                currentJackpot: settings.currentJackpot || settings.initialJackpot || 1000
            }
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
            return res.status(400).json({ message: 'No Plinko plays remaining. Deposit 10 USDT to get 1 play!' });
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
        
        const currentJackpot = settings.currentJackpot || settings.initialJackpot || 1000;
        const targetJackpot = settings.targetJackpot || 5000;
        let rewardAmount = 0;
        let isJackpotWon = false;

        // If rolled slotIndex === 6 (Jackpot) but currentJackpot < targetJackpot, fall back to slotIndex = 0 (normal slot)
        if (slotIndex === 6 && currentJackpot < targetJackpot) {
            slotIndex = 0;
        }

        if (slotIndex === 6 && currentJackpot >= targetJackpot) {
            // Jackpot won
            rewardAmount = currentJackpot;
            isJackpotWon = true;
            
            // Reset jackpot
            settings.currentJackpot = settings.initialJackpot || 1000;
            await settings.save();
        } else {
            // Normal reward: random percentage between 0.001% and 0.01% of current jackpot
            // We divide this range into sub-ranges matching the slot multipliers visually
            let minPercent = 0.001 / 100;
            let maxPercent = 0.01 / 100;

            if (slotIndex === 0) {
                minPercent = 0.001 / 100;
                maxPercent = 0.002 / 100;
            } else if (slotIndex === 1) {
                minPercent = 0.002 / 100;
                maxPercent = 0.0035 / 100;
            } else if (slotIndex === 2 || slotIndex === 8) {
                minPercent = 0.0035 / 100;
                maxPercent = 0.0055 / 100;
            } else if (slotIndex === 3) {
                minPercent = 0.0055 / 100;
                maxPercent = 0.007 / 100;
            } else if (slotIndex === 4 || slotIndex === 7) {
                minPercent = 0.007 / 100;
                maxPercent = 0.0085 / 100;
            } else if (slotIndex === 5) {
                minPercent = 0.0085 / 100;
                maxPercent = 0.01 / 100;
            }

            const randomPercent = minPercent + Math.random() * (maxPercent - minPercent);
            rewardAmount = Math.round(currentJackpot * randomPercent * 10000) / 10000;
        }

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
            description: isJackpotWon 
                ? `Plinko Game JACKPOT reward: +${rewardAmount} AQE`
                : `Plinko Game reward: +${rewardAmount} AQE`
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
            playedAt: plinkoLog.playedAt,
            isJackpotWon,
            currentJackpot: settings.currentJackpot
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

export const updatePlinkoSettingsAdmin = async (req, res) => {
    const { initialJackpot, targetJackpot } = req.body;
    try {
        let settings = await PlinkoSettings.findOne();
        if (!settings) {
            settings = new PlinkoSettings();
        }

        if (initialJackpot !== undefined) {
            settings.initialJackpot = Number(initialJackpot);
            // If current jackpot is not set or is less than the new initial, set it to the new initial
            if (settings.currentJackpot === undefined || settings.currentJackpot < settings.initialJackpot) {
                settings.currentJackpot = settings.initialJackpot;
            }
        }
        if (targetJackpot !== undefined) {
            settings.targetJackpot = Number(targetJackpot);
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
