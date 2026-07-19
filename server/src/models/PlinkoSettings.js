import mongoose from 'mongoose';

const plinkoSettingsSchema = mongoose.Schema({
    pointsToAqeRate: {
        type: Number,
        default: 1 // 1 Plinko Point = 1 AQE by default
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
    },
    initialJackpot: {
        type: Number,
        default: 1000
    },
    targetJackpot: {
        type: Number,
        default: 5000
    },
    currentJackpot: {
        type: Number,
        default: 1000
    }
}, { timestamps: true });

const PlinkoSettings = mongoose.model('PlinkoSettings', plinkoSettingsSchema);
export default PlinkoSettings;
