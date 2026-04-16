import crypto from 'crypto';
import User from '../models/User.js';
import { generateToken } from '../utils/jwt.js';
import { sendConfirmationEmail } from '../utils/emailService.js';

// @desc    Register a new user
export const registerUser = async (req, res) => {
    try {
        const { firstName, lastName, email, phone, password, refId } = req.body;
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'Người dùng đã tồn tại' });

        const confirmationToken = crypto.randomBytes(32).toString('hex');
        const user = await User.create({
            firstName, lastName, email, phone, password,
            referralId: refId || null,
            confirmationToken
        });

        if (user) {
            await sendConfirmationEmail(user.email, confirmationToken, user.firstName);
            res.status(201).json({ message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác nhận tài khoản.' });
        } else {
            res.status(400).json({ message: 'Thông tin người dùng không hợp lệ' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Confirm email
export const confirmEmail = async (req, res) => {
    try {
        const { token } = req.params;
        const user = await User.findOne({ confirmationToken: token });
        if (!user) return res.status(400).json({ message: 'Mã xác nhận không hợp lệ hoặc đã hết hạn.' });

        user.isActive = true;
        user.confirmationToken = undefined;
        await user.save();
        res.status(200).json({ message: 'Tài khoản đã được xác thực thành công!' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Auth user & get token
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            if (!user.isActive) return res.status(401).json({ message: 'Vui lòng xác nhận email trước khi đăng nhập.' });
            res.json({
                _id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email,
                kycStatus: user.kycStatus,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Email hoặc mật khẩu không hợp lệ' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res) => {
    if (req.user) {
        res.json(req.user);
    } else {
        res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.firstName = req.body.firstName || user.firstName;
            user.lastName = req.body.lastName || user.lastName;
            user.phone = req.body.phone || user.phone;
            user.birthday = req.body.birthday || user.birthday;
            user.gender = req.body.gender || user.gender;
            user.telegram = req.body.telegram || user.telegram;
            user.address = req.body.address || user.address;
            user.nation = req.body.nation || user.nation;
            user.avatar = req.body.avatar || user.avatar;
            user.walletAddress = req.body.walletAddress || user.walletAddress;

            if (req.body.bankAccounts) {
                user.bankAccounts = req.body.bankAccounts;
            }

            if (req.body.password) {
                user.password = req.body.password;
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                email: updatedUser.email,
                phone: updatedUser.phone,
                birthday: updatedUser.birthday,
                gender: updatedUser.gender,
                telegram: updatedUser.telegram,
                address: updatedUser.address,
                nation: updatedUser.nation,
                avatar: updatedUser.avatar,
                walletAddress: updatedUser.walletAddress,
                bankAccounts: updatedUser.bankAccounts,
                kycStatus: updatedUser.kycStatus,
                token: generateToken(updatedUser._id),
            });
        } else {
            res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
