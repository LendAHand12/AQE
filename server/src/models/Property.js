import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema({
    title: { type: String, required: true },
    address: { type: String, required: true },
    totalFunding: { type: Number, required: true },
    tokenPrice: { type: Number, required: true },
    minInvestment: { type: Number, required: true },
    expectedApy: { type: Number, required: true },
    status: { 
        type: String, 
        enum: ['funding', 'completed', 'paused', 'presales'],
        default: 'presales'
    },
    duration: { type: Number, required: true }, // months
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    description: { type: String, required: true },
    images: [{ type: String }],
    roi: { type: Number, default: 0 },
    expectedAppreciation: { type: Number, default: 0 },
    managementFee: { type: Number, default: 0 },
    propertyType: { type: String },
    legalNumber: { type: String },
    managementUnit: { type: String },
    preSales: {
        isActive: { type: Boolean, default: false },
        startDate: { type: Date },
        slots: { type: Number },
        bonusToken: { type: Number, default: 10 },
        depositDeadline: { type: Date }
    },
    currentFunding: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

const Property = mongoose.model('Property', propertySchema);
export default Property;
