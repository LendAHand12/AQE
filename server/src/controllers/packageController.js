import InvestmentPackage from '../models/InvestmentPackage.js';
import AdminLog from '../models/AdminLog.js';

// @desc    Get active Partnership packages for users
// @route   GET /api/payments/packages
// @access  Protected (User)
export const getPackages = async (req, res) => {
    try {
        const packages = await InvestmentPackage.find({ isActive: true }).sort({ price: 1 });
        res.json(packages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all Partnership packages for admin
// @route   GET /api/admin/packages
// @access  Admin
export const adminGetPackages = async (req, res) => {
    try {
        const packages = await InvestmentPackage.find({}).sort({ price: 1 });
        res.json(packages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const PACKAGE_COLORS = [
    '#276152', // Emerald Green
    '#1d3557', // Midnight Blue
    '#7209b7', // Rich Purple
    '#0f4c5c', // Deep Teal
    '#b7094c', // Warm Ruby
    '#4a121a', // Crimson
    '#3a0ca3', // Indigo Royal
    '#1b4965', // Ocean Blue
    '#2d3748', // Charcoal Grey
];

// @desc    Create new investment package
// @route   POST /api/admin/packages
// @access  Admin
export const adminCreatePackage = async (req, res) => {
    try {
        const {
            title,
            price,
            description,
            bonusPercent,
            segment,
            aqeAmount,
            f1CommissionPercent,
            f2CommissionPercent,
            isActive,
            color,
            stayDays,
            roomType,
            vipLounge,
            guests,
            roomService,
            transportation,
            savings,
            wellness,
            priority,
            concierge
        } = req.body;

        if (!title || !price || !description || !aqeAmount || !segment) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ các trường bắt buộc' });
        }

        const randomColor = PACKAGE_COLORS[Math.floor(Math.random() * PACKAGE_COLORS.length)];

        const packageData = await InvestmentPackage.create({
            title,
            price: Number(price),
            description,
            bonusPercent: Number(bonusPercent || 0),
            segment,
            aqeAmount: Number(aqeAmount),
            f1CommissionPercent: Number(f1CommissionPercent !== undefined ? f1CommissionPercent : 8),
            f2CommissionPercent: Number(f2CommissionPercent !== undefined ? f2CommissionPercent : 2),
            isActive: isActive !== undefined ? isActive : true,
            color: color || randomColor,
            stayDays: stayDays || '',
            roomType: roomType || '',
            vipLounge: vipLounge === true || vipLounge === 'true',
            guests: guests || '',
            roomService: roomService === true || roomService === 'true',
            transportation: transportation === true || transportation === 'true',
            savings: savings || '',
            wellness: wellness === true || wellness === 'true',
            priority: priority === true || priority === 'true',
            concierge: concierge === true || concierge === 'true'
        });

        // Log the action
        await AdminLog.create({
            adminId: req.admin._id,
            adminUsername: req.admin.username,
            action: 'CREATE_INVESTMENT_PACKAGE',
            target: title,
            details: { packageId: packageData._id, data: req.body }
        });

        res.status(201).json(packageData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update investment package
// @route   PUT /api/admin/packages/:id
// @access  Admin
export const adminUpdatePackage = async (req, res) => {
    try {
        const {
            title,
            price,
            description,
            bonusPercent,
            segment,
            aqeAmount,
            f1CommissionPercent,
            f2CommissionPercent,
            isActive,
            color,
            stayDays,
            roomType,
            vipLounge,
            guests,
            roomService,
            transportation,
            savings,
            wellness,
            priority,
            concierge
        } = req.body;

        const investmentPackage = await InvestmentPackage.findById(req.params.id);

        if (!investmentPackage) {
            return res.status(404).json({ message: 'Không tìm thấy gói đầu tư' });
        }

        investmentPackage.title = title || investmentPackage.title;
        investmentPackage.price = price !== undefined ? Number(price) : investmentPackage.price;
        investmentPackage.description = description || investmentPackage.description;
        investmentPackage.bonusPercent = bonusPercent !== undefined ? Number(bonusPercent) : investmentPackage.bonusPercent;
        investmentPackage.segment = segment || investmentPackage.segment;
        investmentPackage.aqeAmount = aqeAmount !== undefined ? Number(aqeAmount) : investmentPackage.aqeAmount;
        investmentPackage.f1CommissionPercent = f1CommissionPercent !== undefined ? Number(f1CommissionPercent) : investmentPackage.f1CommissionPercent;
        investmentPackage.f2CommissionPercent = f2CommissionPercent !== undefined ? Number(f2CommissionPercent) : investmentPackage.f2CommissionPercent;
        investmentPackage.isActive = isActive !== undefined ? isActive : investmentPackage.isActive;
        investmentPackage.color = color || investmentPackage.color;
        
        // Benefits fields
        investmentPackage.stayDays = stayDays !== undefined ? stayDays : investmentPackage.stayDays;
        investmentPackage.roomType = roomType !== undefined ? roomType : investmentPackage.roomType;
        investmentPackage.vipLounge = vipLounge !== undefined ? (vipLounge === true || vipLounge === 'true') : investmentPackage.vipLounge;
        investmentPackage.guests = guests !== undefined ? guests : investmentPackage.guests;
        investmentPackage.roomService = roomService !== undefined ? (roomService === true || roomService === 'true') : investmentPackage.roomService;
        investmentPackage.transportation = transportation !== undefined ? (transportation === true || transportation === 'true') : investmentPackage.transportation;
        investmentPackage.savings = savings !== undefined ? savings : investmentPackage.savings;
        investmentPackage.wellness = wellness !== undefined ? (wellness === true || wellness === 'true') : investmentPackage.wellness;
        investmentPackage.priority = priority !== undefined ? (priority === true || priority === 'true') : investmentPackage.priority;
        investmentPackage.concierge = concierge !== undefined ? (concierge === true || concierge === 'true') : investmentPackage.concierge;

        const updatedPackage = await investmentPackage.save();

        // Log the action
        await AdminLog.create({
            adminId: req.admin._id,
            adminUsername: req.admin.username,
            action: 'UPDATE_INVESTMENT_PACKAGE',
            target: investmentPackage.title,
            details: { packageId: investmentPackage._id, changes: req.body }
        });

        res.json(updatedPackage);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete investment package
// @route   DELETE /api/admin/packages/:id
// @access  Admin
export const adminDeletePackage = async (req, res) => {
    try {
        const investmentPackage = await InvestmentPackage.findById(req.params.id);

        if (!investmentPackage) {
            return res.status(404).json({ message: 'Không tìm thấy gói đầu tư' });
        }

        const title = investmentPackage.title;
        await InvestmentPackage.deleteOne({ _id: investmentPackage._id });

        // Log the action
        await AdminLog.create({
            adminId: req.admin._id,
            adminUsername: req.admin.username,
            action: 'DELETE_INVESTMENT_PACKAGE',
            target: title,
            details: { packageId: req.params.id }
        });

        res.json({ message: 'Gói đầu tư đã được xóa thành công' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
