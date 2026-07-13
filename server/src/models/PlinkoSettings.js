import mongoose from 'mongoose';

const plinkoSettingsSchema = mongoose.Schema({
    slots: {
        type: [
            {
                amount: { type: Number, required: true },
                weight: { type: Number, required: true }
            }
        ],
        default: [
            { amount: 100, weight: 25 },
            { amount: 150, weight: 20 },
            { amount: 200, weight: 15 },
            { amount: 300, weight: 12 },
            { amount: 500, weight: 8 },
            { amount: 750, weight: 4 },
            { amount: 1000, weight: 1 },
            { amount: 500, weight: 8 },
            { amount: 200, weight: 15 }
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
