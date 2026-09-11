import mongoose from 'mongoose';

const plinkoSettingsSchema = mongoose.Schema({
    plinkoBaseReward: {
        type: Number,
        default: 1 // Base AQE reward per ball drop (X), actual reward = X * multiplier
    },
    jackpotContributionRate: {
        type: Number,
        default: 0.001 // 0.1% of every USDT deposit goes into the jackpot pool
    },
    targetJackpot: {
        type: Number,
        default: 1000 // USDT target; when currentJackpot reaches this, the jackpot slot is armed
    },
    currentJackpot: {
        type: Number,
        default: 0 // USDT accumulated so far
    },
    slots: {
        type: [
            {
                multiplier: { type: Number, required: true, default: 1 },
                weight: { type: Number, required: true, default: 10 }
            }
        ],
        default: [
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
        ]
    }
}, { timestamps: true });

const PlinkoSettings = mongoose.model('PlinkoSettings', plinkoSettingsSchema);
export default PlinkoSettings;
