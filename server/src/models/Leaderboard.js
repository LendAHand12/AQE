import mongoose from 'mongoose';

const leaderboardSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    username: String,
    fullName: String,
    totalSales: {
        type: Number,
        default: 0
    },
    rank: {
        type: Number,
        required: true
    },
    previousRank: {
        type: Number,
        default: null
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);
export default Leaderboard;
