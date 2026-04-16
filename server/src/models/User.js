import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const bankAccountSchema = mongoose.Schema({
    bankName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    accountName: { type: String, required: true },
    isDefault: { type: Boolean, default: false }
});

const userSchema = mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    referralId: {
        type: String,
        default: null
    },
    isActive: {
        type: Boolean,
        default: false
    },
    confirmationToken: {
        type: String
    },
    avatar: {
        type: String,
        default: null
    },
    // New Fields for Settings
    birthday: {
        type: Date
    },
    gender: {
        type: String,
        enum: ['Nam', 'Nữ', 'Khác'],
        default: 'Nam'
    },
    telegram: {
        type: String
    },
    address: {
        type: String
    },
    nation: {
        type: String,
        default: 'Việt Nam'
    },
    kycStatus: {
        type: String,
        enum: ['verified', 'pending', 'unverified'],
        default: 'unverified'
    },
    walletAddress: {
        type: String,
        default: null
    },
    usdtBalance: {
        type: Number,
        default: 0
    },
    aqeBalance: {
        type: Number,
        default: 0
    },
    bankAccounts: [bankAccountSchema]
}, {
    timestamps: true
});

// Method to compare entered password with hashed password
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Encrypt password before saving
userSchema.pre('save', async function() {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);
export default User;
