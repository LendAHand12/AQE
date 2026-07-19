import mongoose from 'mongoose';

const plinkoHistorySchema = mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    betAmount: {
        type: Number,
        default: 1
    },
    multiplier: {
        type: Number,
        default: 1
    },
    rewardAmount: { 
        type: Number, 
        required: true 
    },
    symbol: { 
        type: String, 
        default: 'POINTS' 
    },
    playedAt: { 
        type: Date, 
        default: Date.now 
    }
}, { timestamps: true });

const PlinkoHistory = mongoose.model('PlinkoHistory', plinkoHistorySchema);

export default PlinkoHistory;
