import mongoose from 'mongoose';

const investmentPackageSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    description: {
        type: String,
        required: true
    },
    bonusPercent: {
        type: Number,
        default: 0,
        min: 0
    },
    segment: {
        type: String,
        required: true,
        enum: ['Cơ bản', 'Nâng cao', 'Cao cấp'],
        default: 'Cơ bản'
    },
    aqeAmount: {
        type: Number,
        required: true,
        min: 0
    },
    f1CommissionPercent: {
        type: Number,
        default: 8,
        min: 0,
        max: 100
    },
    f2CommissionPercent: {
        type: Number,
        default: 2,
        min: 0,
        max: 100
    },
    isActive: {
        type: Boolean,
        default: true
    },
    color: {
        type: String,
        default: '#276152'
    },
    // Comparison Table Fields
    stayDays: {
        type: String,
        default: ''
    },
    roomType: {
        type: String,
        default: ''
    },
    vipLounge: {
        type: Boolean,
        default: false
    },
    guests: {
        type: String,
        default: ''
    },
    roomService: {
        type: Boolean,
        default: false
    },
    transportation: {
        type: Boolean,
        default: false
    },
    savings: {
        type: String,
        default: ''
    },
    wellness: {
        type: Boolean,
        default: false
    },
    priority: {
        type: Boolean,
        default: false
    },
    concierge: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const InvestmentPackage = mongoose.model('InvestmentPackage', investmentPackageSchema);
export default InvestmentPackage;
