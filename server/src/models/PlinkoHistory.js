import mongoose from 'mongoose';

const plinkoHistorySchema = mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    rewardAmount: { 
        type: Number, 
        required: true 
    },
    symbol: { 
        type: String, 
        default: 'AQE' 
    },
    playedAt: { 
        type: Date, 
        default: Date.now 
    }
}, { timestamps: true });

const PlinkoHistory = mongoose.model('PlinkoHistory', plinkoHistorySchema);

export default PlinkoHistory;
