import mongoose from 'mongoose';

const plinkoSettingsSchema = mongoose.Schema({
    engineGravity: { type: Number, default: 0.45 },
    frictionAir: { type: Number, default: 0.03 },
    vxMultiplier: { type: Number, default: 0.8 },
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
    }
}, { timestamps: true });

const PlinkoSettings = mongoose.model('PlinkoSettings', plinkoSettingsSchema);
export default PlinkoSettings;
