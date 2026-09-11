import User from '../models/User.js';
import BalanceHistory from '../models/BalanceHistory.js';
import PlinkoHistory from '../models/PlinkoHistory.js';
import PlinkoSettings from '../models/PlinkoSettings.js';
import AdminLog from '../models/AdminLog.js';
import Notification from '../models/Notification.js';
import { emitNotification } from '../utils/socket.js';
import { getSystemConfig } from '../utils/configHelper.js';

const defaultSlots = [
    { multiplier: 110, weight: 1 },
    { multiplier: 41, weight: 16 },
    { multiplier: 10, weight: 120 },
    { multiplier: 5, weight: 560 },
    { multiplier: 2, weight: 1820 },
    { multiplier: 1, weight: 4368 },
    { multiplier: 0.5, weight: 8008 },
    { multiplier: 0.2, weight: 11440 },
    { multiplier: 0.2, weight: 20000 },
    { multiplier: 0.2, weight: 11440 },
    { multiplier: 0.5, weight: 8008 },
    { multiplier: 1, weight: 4368 },
    { multiplier: 2, weight: 1820 },
    { multiplier: 5, weight: 560 },
    { multiplier: 10, weight: 120 },
    { multiplier: 41, weight: 16 },
    { multiplier: 110, weight: 1 }
];

// @desc    Get user's Plinko info (balls, pending AQE reward, settings and recent history)
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

        const targetJackpot = settings.targetJackpot || 0;
        const currentJackpot = settings.currentJackpot || 0;

        res.json({
            plinkoBalls: user.plinkoBalls || 0,
            plinkoAqeReward: user.plinkoAqeReward || 0,
            history,
            settings: {
                ...settings.toObject(),
                plinkoBaseReward: settings.plinkoBaseReward !== undefined ? settings.plinkoBaseReward : 1
            },
            jackpot: {
                current: currentJackpot,
                target: targetJackpot,
                isArmed: targetJackpot > 0 && currentJackpot >= targetJackpot
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Play Plinko (drop one ball, winnings go to pending AQE reward)
// @route   POST /api/plinko/play
// @access  Private
export const playPlinko = async (req, res) => {
    try {
        // 1. Deduct 1 ball atomically and verify user has balls available
        const updatedUser = await User.findOneAndUpdate(
            { _id: req.user._id, plinkoBalls: { $gte: 1 } },
            { $inc: { plinkoBalls: -1 } },
            { returnDocument: 'after' }
        );

        if (!updatedUser) {
            const userExists = await User.findById(req.user._id);
            if (!userExists) {
                return res.status(404).json({ message: 'auth.errors.user_not_found' });
            }
            return res.status(400).json({ message: 'plinko.insufficient_balls' });
        }

        // Fetch Plinko Settings
        let settings = await PlinkoSettings.findOne();
        if (!settings) {
            settings = await PlinkoSettings.create({ slots: defaultSlots });
        } else if (!settings.slots || settings.slots.length !== 17 || settings.slots[0].multiplier !== 110 || settings.slots[4].multiplier !== 2) {
            settings.slots = defaultSlots;
            await settings.save();
        }

        const slots = settings.slots;
        const baseReward = settings.plinkoBaseReward !== undefined ? settings.plinkoBaseReward : 1;

        // Use client-provided physical landed slotIndex or weighted fallback
        let slotIndex = 8;
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

        // Jackpot check: only the two outer-edge slots can trigger it, and only while armed (currentJackpot >= targetJackpot)
        const isJackpotSlot = slotIndex === 0 || slotIndex === slots.length - 1;
        let isJackpotWin = false;
        let rewardAqe;
        let jackpotWonUsdt = 0;

        if (isJackpotSlot && settings.targetJackpot > 0 && settings.currentJackpot >= settings.targetJackpot) {
            // Atomic compare-and-reset: only one concurrent request can win the jackpot
            const claimedSettings = await PlinkoSettings.findOneAndUpdate(
                { _id: settings._id, currentJackpot: { $gte: settings.targetJackpot } },
                { $set: { currentJackpot: 0 } },
                { new: false }
            );

            if (claimedSettings) {
                jackpotWonUsdt = claimedSettings.currentJackpot;
                const systemConfig = await getSystemConfig();
                const aqeRate = systemConfig.aqeToUsdtRate;
                rewardAqe = Math.round((jackpotWonUsdt / aqeRate) * 10000) / 10000;
                isJackpotWin = true;
            }
        }

        if (!isJackpotWin) {
            rewardAqe = Math.round(baseReward * multiplier * 10000) / 10000;
        }

        // 2. Credit won AQE to the user's pending Plinko reward (not aqeBalance directly)
        const finalUser = await User.findByIdAndUpdate(
            updatedUser._id,
            { $inc: { plinkoAqeReward: rewardAqe } },
            { new: true }
        );

        if (!finalUser) {
            return res.status(404).json({ message: 'User not found during reward update' });
        }

        // 3. Create PlinkoHistory log
        const plinkoLog = await PlinkoHistory.create({
            userId: finalUser._id,
            betAmount: 1,
            multiplier,
            rewardAmount: rewardAqe,
            symbol: 'AQE',
            isJackpot: isJackpotWin
        });

        if (isJackpotWin) {
            await Notification.create({
                userId: finalUser._id,
                title: 'Jackpot Plinko!',
                message: `🎉 Chúc mừng! Bạn đã trúng Jackpot Plinko và nhận được ${rewardAqe} AQE (tương đương ${jackpotWonUsdt.toFixed(2)} USDT)!`,
                type: 'SYSTEM'
            });

            emitNotification(finalUser._id, {
                title: 'Jackpot Plinko!',
                message: `🎉 JACKPOT! +${rewardAqe} AQE`,
                type: 'SYSTEM'
            });
        }

        res.json({
            success: true,
            multiplier,
            rewardAmount: rewardAqe,
            slotIndex,
            isJackpotWin,
            jackpotWonUsdt,
            newBalls: finalUser.plinkoBalls,
            newPendingReward: finalUser.plinkoAqeReward,
            newBalance: finalUser.aqeBalance,
            playedAt: plinkoLog.playedAt
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Claim pending Plinko AQE reward into main AQE balance
// @route   POST /api/plinko/claim
// @access  Private
export const claimPlinkoReward = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'auth.errors.user_not_found' });
        }

        const pendingReward = user.plinkoAqeReward || 0;
        if (pendingReward <= 0) {
            return res.status(400).json({ message: 'plinko.no_pending_reward' });
        }

        // Deduct pending reward & add to AQE balance atomically
        const updatedUser = await User.findOneAndUpdate(
            { _id: req.user._id, plinkoAqeReward: { $gte: pendingReward } },
            {
                $inc: {
                    plinkoAqeReward: -pendingReward,
                    aqeBalance: pendingReward
                }
            },
            { returnDocument: 'after' }
        );

        if (!updatedUser) {
            return res.status(400).json({ message: 'plinko.no_pending_reward' });
        }

        // Log Balance History
        await BalanceHistory.create({
            userId: updatedUser._id,
            amount: pendingReward,
            symbol: 'AQE',
            type: 'REWARD',
            status: 'SUCCESS',
            isOfficial: true,
            balanceBefore: updatedUser.aqeBalance - pendingReward,
            balanceAfter: updatedUser.aqeBalance,
            description: `Claim thưởng Plinko: ${pendingReward} AQE`
        });

        res.json({
            success: true,
            claimedAmount: pendingReward,
            newPendingReward: updatedUser.plinkoAqeReward,
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
    const { plinkoBaseReward, slots, jackpotContributionRate, targetJackpot } = req.body;
    try {
        let settings = await PlinkoSettings.findOne();
        if (!settings) {
            settings = new PlinkoSettings();
        }

        if (plinkoBaseReward !== undefined) {
            settings.plinkoBaseReward = Number(plinkoBaseReward);
        }
        if (slots && Array.isArray(slots)) {
            settings.slots = slots;
        }
        if (jackpotContributionRate !== undefined) {
            settings.jackpotContributionRate = Number(jackpotContributionRate);
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
