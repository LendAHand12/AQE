import mongoose from 'mongoose';

const walletConnectionSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    walletAddress: {
        type: String,
        required: true
    },
    walletName: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

const WalletConnection = mongoose.model('WalletConnection', walletConnectionSchema);
export default WalletConnection;
