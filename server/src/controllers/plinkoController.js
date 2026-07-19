import User from '../models/User.js';
import BalanceHistory from '../models/BalanceHistory.js';
import PlinkoHistory from '../models/PlinkoHistory.js';
import PlinkoSettings from '../models/PlinkoSettings.js';
import AdminLog from '../models/AdminLog.js';

// @desc    Get user's Plinko info (points, plays, settings and recent history)
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
            plinkoPoints: user.plinkoPoints || 0,
            history,
            settings: {
                ...settings.toObject(),
                pointsToAqeRate: settings.pointsToAqeRate !== undefined ? settings.pointsToAqeRate : 1,
                initialJackpot: settings.initialJackpot || 1000,
                targetJackpot: settings.targetJackpot || 5000,
                currentJackpot: settings.currentJackpot || settings.initialJackpot || 1000
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Play Plinko (Drop a ball with bet amount in Points)
// @route   POST /api/plinko/play
// @access  Private
export const playPlinko = async (req, res) => {
    try {
        const betAmount = Number(req.body.betAmount || req.body.betPoints || 1);
        if (isNaN(betAmount) || betAmount <= 0) {
            return res.status(400).json({ message: 'plinko.invalid_bet_amount' });
        }

        // 1. Deduct betAmount points atomically and verify user exists with enough points
        const updatedUser = await User.findOneAndUpdate(
            { _id: req.user._id, plinkoPoints: { $gte: betAmount } },
            { $inc: { plinkoPoints: -betAmount } },
            { returnDocument: 'after' }
        );

        if (!updatedUser) {
            const userExists = await User.findById(req.user._id);
            if (!userExists) {
                return res.status(404).json({ message: 'auth.errors.user_not_found' });
            }
            return res.status(400).json({ message: 'plinko.insufficient_points' });
        }

        const defaultSlots = [
            { multiplier: 110, weight: 1 },
            { multiplier: 41, weight: 2 },
            { multiplier: 10, weight: 5 },
            { multiplier: 5, weight: 10 },
            { multiplier: 3, weight: 15 },
            { multiplier: 1.5, weight: 25 },
            { multiplier: 1, weight: 40 },
            { multiplier: 0.5, weight: 60 },
            { multiplier: 0.2, weight: 80 },
            { multiplier: 0.5, weight: 60 },
            { multiplier: 1, weight: 40 },
            { multiplier: 1.5, weight: 25 },
            { multiplier: 3, weight: 15 },
            { multiplier: 5, weight: 10 },
            { multiplier: 10, weight: 5 },
            { multiplier: 41, weight: 2 },
            { multiplier: 110, weight: 1 }
        ];

        // Fetch Plinko Settings
        let settings = await PlinkoSettings.findOne();
        if (!settings) {
            settings = await PlinkoSettings.create({ slots: defaultSlots });
        } else if (!settings.slots || settings.slots.length !== 17 || settings.slots[0].multiplier !== 110) {
            settings.slots = defaultSlots;
            await settings.save();
        }

        const slots = settings.slots;

        // Determine slotIndex: if valid clientSlotIndex is provided (0..16), use it; otherwise pick weighted random
        let slotIndex = 0;
        const { slotIndex: clientSlotIndex } = req.body;
        if (typeof clientSlotIndex === 'number' && clientSlotIndex >= 0 && clientSlotIndex < slots.length) {
            slotIndex = clientSlotIndex;
        } else {
            const totalWeight = slots.reduce((sum, slot) => sum + (slot.weight || 1), 0);
            let randomNum = Math.random() * totalWeight;
            for (let i = 0; i < slots.length; i++) {
                randomNum -= (slots[i].weight || 1);
                if (randomNum <= 0) {
                    slotIndex = i;
                    break;
                }
            }
        }

        const multiplier = slots[slotIndex].multiplier !== undefined ? slots[slotIndex].multiplier : (slots[slotIndex].amount || 1);
        const rewardPoints = Math.round(betAmount * multiplier * 100) / 100;

        // 3. Credit won points back to user balance
        const finalUser = await User.findByIdAndUpdate(
            updatedUser._id,
            { $inc: { plinkoPoints: rewardPoints } },
            { new: true }
        );

        if (!finalUser) {
            return res.status(404).json({ message: 'User not found during points update' });
        }

        // 4. Create PlinkoHistory log
        const plinkoLog = await PlinkoHistory.create({
            userId: finalUser._id,
            betAmount,
            multiplier,
            rewardAmount: rewardPoints,
            symbol: 'POINTS'
        });

        res.json({
            success: true,
            betAmount,
            multiplier,
            rewardAmount: rewardPoints,
            slotIndex,
            newPoints: finalUser.plinkoPoints,
            newBalance: finalUser.aqeBalance,
            playedAt: plinkoLog.playedAt
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Convert Plinko Points to AQE Tokens
// @route   POST /api/plinko/convert
// @access  Private
export const convertPointsToAqe = async (req, res) => {
    try {
        const pointsToConvert = Number(req.body.points);
        if (isNaN(pointsToConvert) || pointsToConvert <= 0) {
            return res.status(400).json({ message: 'plinko.invalid_points_convert' });
        }

        let settings = await PlinkoSettings.findOne();
        if (!settings) {
            settings = await PlinkoSettings.create({});
        }

        const rate = settings.pointsToAqeRate !== undefined ? settings.pointsToAqeRate : 1;
        const aqeAmount = Math.round(pointsToConvert * rate * 10000) / 10000;

        // Deduct points & add AQE atomically
        const updatedUser = await User.findOneAndUpdate(
            { _id: req.user._id, plinkoPoints: { $gte: pointsToConvert } },
            { 
                $inc: { 
                    plinkoPoints: -pointsToConvert,
                    aqeBalance: aqeAmount
                } 
            },
            { returnDocument: 'after' }
        );

        if (!updatedUser) {
            return res.status(400).json({ message: 'plinko.insufficient_points_convert' });
        }

        // Log Balance History
        await BalanceHistory.create({
            userId: updatedUser._id,
            amount: aqeAmount,
            symbol: 'AQE',
            type: 'REWARD',
            status: 'SUCCESS',
            isOfficial: true,
            balanceBefore: updatedUser.aqeBalance - aqeAmount,
            balanceAfter: updatedUser.aqeBalance,
            description: `Quy đổi ${pointsToConvert} điểm Plinko sang ${aqeAmount} AQE (Tỷ lệ: 1 Điểm = ${rate} AQE)`
        });

        res.json({
            success: true,
            convertedPoints: pointsToConvert,
            aqeReceived: aqeAmount,
            newPoints: updatedUser.plinkoPoints,
            newAqeBalance: updatedUser.aqeBalance
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
// @access  Private (Admin)
export const updatePlinkoSettingsAdmin = async (req, res) => {
    const { initialJackpot, targetJackpot, pointsToAqeRate, slots } = req.body;
    try {
        let settings = await PlinkoSettings.findOne();
        if (!settings) {
            settings = new PlinkoSettings();
        }

        if (pointsToAqeRate !== undefined) {
            settings.pointsToAqeRate = Number(pointsToAqeRate);
        }
        if (initialJackpot !== undefined) {
            settings.initialJackpot = Number(initialJackpot);
            if (settings.currentJackpot === undefined || settings.currentJackpot < settings.initialJackpot) {
                settings.currentJackpot = settings.initialJackpot;
            }
        }
        if (targetJackpot !== undefined) {
            settings.targetJackpot = Number(targetJackpot);
        }
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
