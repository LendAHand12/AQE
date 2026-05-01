import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const bankAccountSchema = mongoose.Schema({
    bankName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    accountName: { type: String, required: true },
    isDefault: { type: Boolean, default: false }
});

const userSchema = mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    countryCode: {
        type: String,
        default: '+84'
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
    isDeleted: {
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
    idCardFront: {
        type: String,
        default: null
    },
    idCardBack: {
        type: String,
        default: null
    },
    portraitPhoto: {
        type: String,
        default: null
    },
    kycStatus: {
        type: String,
        enum: ['verified', 'pending', 'unverified', 'rejected'],
        default: 'unverified'
    },
    faceTecTid: {
        type: String,
        default: null
    },
    isTwoFactorEnabled: {
        type: Boolean,
        default: false
    },
    twoFactorSecret: {
        type: String,
        default: null
    },
    referredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    pledgeUsdt: {
        type: Number,
        default: 0
    },
    paidUsdtPreRegister: {
        type: Number,
        default: 0
    },
    preRegisterTokens: {
        type: Number,
        default: 0
    },
    hasReceivedPromotion: {
        type: Boolean,
        default: false
    },
    isPledgeCompleted: {
        type: Boolean,
        default: false
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
    resetPasswordToken: {
        type: String,
        default: null
    },
    resetPasswordExpires: {
        type: Date,
        default: null
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
