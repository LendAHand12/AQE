import crypto from 'crypto';
import User from '../models/User.js';
import Commission from '../models/Commission.js';
import { generateToken } from '../utils/jwt.js';
import { sendConfirmationEmail, sendResetPasswordEmail } from '../utils/emailService.js';
import { generateTwoFactorSecret, verifyTwoFactorCode } from '../utils/twoFactor.js';
// @desc    Register a new user
export const registerUser = async (req, res) => {
    try {
        const { fullName, username, email, phone, password, refId } = req.body;

        // Valid username: no spaces, no special chars, no accents, only lowercase alphanumeric
        const usernameRegex = /^[a-z0-9]+$/;
        if (!usernameRegex.test(username)) {
            return res.status(400).json({ message: 'auth.errors.invalid_username_format' });
        }

        const userExists = await User.findOne({ 
            isDeleted: false,
            $or: [
                { email }, 
                { username: username.toLowerCase() },
                { phone }
            ] 
        });
        
        if (userExists) {
            let field = 'user_exists';
            if (userExists.email === email) field = 'email_exists';
            else if (userExists.username === username.toLowerCase()) field = 'username_exists';
            else if (userExists.phone === phone) field = 'phone_exists';
            
            return res.status(400).json({ message: `auth.errors.${field}` });
        }

        let referrer = null;
        if (!refId) {
            return res.status(400).json({ message: 'auth.errors.referral_required' });
        }

        if (refId) {
            // Look up by username (mặc định username làm ref)
            referrer = await User.findOne({ username: refId.toLowerCase(), isDeleted: false });
            
            if (!referrer) {
                return res.status(400).json({ message: 'auth.errors.invalid_referral' });
            }

            // Check if referrer has paid at least 30% of their total pledge
            if (referrer.pledgeUsdt > 0) {
                const payPercent = (referrer.paidUsdtPreRegister / referrer.pledgeUsdt) * 100;
                if (payPercent < 30) {
                    return res.status(400).json({ message: 'auth.errors.referral_not_qualified' });
                }
            } else {
                // If they haven't pledged anything, they are not qualified to refer
                return res.status(400).json({ message: 'auth.errors.referral_not_qualified' });
            }
        }

        const confirmationToken = crypto.randomBytes(32).toString('hex');
        const user = await User.create({
            fullName, 
            username: username.toLowerCase(), 
            email, 
            phone, 
            password,
            referredBy: referrer ? referrer._id : null,
            confirmationToken
        });

        if (user) {
            await sendConfirmationEmail(user.email, confirmationToken, user.fullName);
            res.status(201).json({ message: 'auth.register_success_desc' });
        } else {
            res.status(400).json({ message: 'auth.errors.invalid_user' });
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
        if (!user) return res.status(400).json({ message: 'confirm_email.error_desc' });

        user.isActive = true;
        user.confirmationToken = undefined;
        await user.save();
        res.status(200).json({ message: 'confirm_email.success_title' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Auth user & get token
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email, isDeleted: false });

        if (user && (await user.matchPassword(password))) {
            if (!user.isActive) return res.status(401).json({ message: 'auth.errors.unconfirmed' });
            
            if (user.isTwoFactorEnabled) {
                return res.json({ requires2FA: true, userId: user._id });
            }

            res.json({
                _id: user._id, 
                fullName: user.fullName, 
                username: user.username,
                email: user.email,
                kycStatus: user.kycStatus,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'auth.errors.invalid_credentials' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify 2FA for login
export const verify2FALogin = async (req, res) => {
    try {
        const { userId, code } = req.body;
        const user = await User.findById(userId);

        if (!user || user.isDeleted || !user.isActive) {
            return res.status(401).json({ message: 'auth.errors.user_not_found' });
        }

        const isVerified = verifyTwoFactorCode(user.twoFactorSecret, code);

        if (isVerified) {
            res.json({
                _id: user._id, 
                fullName: user.fullName, 
                username: user.username,
                email: user.email,
                kycStatus: user.kycStatus,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'auth.errors.invalid_2fa_code' });
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
        res.status(404).json({ message: 'auth.errors.user_not_found' });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            // Check for username uniqueness if changing
            if (req.body.username && req.body.username.toLowerCase() !== user.username) {
                const newUsername = req.body.username.toLowerCase();
                const usernameRegex = /^[a-z0-9]+$/;
                if (!usernameRegex.test(newUsername)) {
                    return res.status(400).json({ message: 'auth.errors.invalid_username_format' });
                }
                const usernameExists = await User.findOne({ 
                    username: newUsername, 
                    isDeleted: false 
                });
                if (usernameExists) return res.status(400).json({ message: 'auth.errors.username_exists' });
                user.username = newUsername;
            }

            // Check for phone uniqueness if changing
            if (req.body.phone && req.body.phone !== user.phone) {
                const phoneExists = await User.findOne({ 
                    phone: req.body.phone, 
                    isDeleted: false 
                });
                if (phoneExists) return res.status(400).json({ message: 'auth.errors.phone_exists' });
                user.phone = req.body.phone;
            }

            user.fullName = req.body.fullName || user.fullName;
            user.birthday = req.body.birthday || user.birthday;
            user.gender = req.body.gender || user.gender;
            user.telegram = req.body.telegram || user.telegram;
            user.address = req.body.address || user.address;
            user.nation = req.body.nation || user.nation;
            user.walletAddress = req.body.walletAddress || user.walletAddress;
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
            res.status(404).json({ message: 'auth.errors.user_not_found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// @desc    Update FaceTec status
export const updateFaceTecStatus = async (req, res) => {
    try {
        const { facetecTid } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'auth.errors.user_not_found' });

        user.faceTecTid = facetecTid;
        user.kycStatus = 'verified'; // Mark as verified upon FaceTec success
        await user.save();

        res.json({ message: 'kyc.facescan.success', user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Generate 2FA Secret
export const generate2FA = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const { secret, qrCodeUrl } = await generateTwoFactorSecret(user.email);
        
        user.twoFactorSecret = secret;
        await user.save();

        res.json({ secret, qrCodeUrl });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Enable 2FA
export const enable2FA = async (req, res) => {
    try {
        const { code } = req.body;
        const user = await User.findById(req.user._id);

        const isVerified = verifyTwoFactorCode(user.twoFactorSecret, code);

        if (isVerified) {
            user.isTwoFactorEnabled = true;
            await user.save();
            res.json({ message: '2FA enabled successfully', isTwoFactorEnabled: true });
        } else {
            res.status(400).json({ message: 'auth.errors.invalid_2fa_code' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Disable 2FA
export const disable2FA = async (req, res) => {
    try {
        const { code } = req.body;
        const user = await User.findById(req.user._id);

        const isVerified = verifyTwoFactorCode(user.twoFactorSecret, code);

        if (isVerified) {
            user.isTwoFactorEnabled = false;
            // Optionally clear the secret: user.twoFactorSecret = null;
            await user.save();
            res.json({ message: '2FA disabled successfully', isTwoFactorEnabled: false });
        } else {
            res.status(400).json({ message: 'auth.errors.invalid_2fa_code' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Submit ID Verification (Step 1)
export const submitIdVerification = async (req, res) => {
    try {
        const { idCardFront, idCardBack, portraitPhoto } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) return res.status(404).json({ message: 'auth.errors.user_not_found' });

        if (user.kycStatus === 'verified' || user.kycStatus === 'pending') {
            return res.status(400).json({ message: 'kyc.errors.step_locked' });
        }

        user.idCardFront = idCardFront;
        user.idCardBack = idCardBack;
        user.portraitPhoto = portraitPhoto;
        user.kycStatus = 'pending';

        await user.save();
        res.json({ message: 'kyc.status.pending_desc', user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// @desc    Get user's referral network (F1 & F2)
// @route   GET /api/auth/referrals
// @access  Private
export const getReferrals = async (req, res) => {
    try {
        const userId = req.user._id;

        // Find F1s (Direct referrals) who are active
        const f1s = await User.find({ referredBy: userId, isActive: true })
            .select('fullName username email pledgeUsdt paidUsdtPreRegister createdAt');

        // Find F2s (Indirect referrals) for each F1
        const network = await Promise.all(f1s.map(async (f1) => {
            const f2s = await User.find({ referredBy: f1._id, isActive: true })
                .select('fullName username email pledgeUsdt paidUsdtPreRegister createdAt');
            
            return {
                ...f1.toObject(),
                f2s
            };
        }));

        // Calculate summary
        const totalF1 = f1s.length;
        const totalF2 = network.reduce((acc, curr) => acc + curr.f2s.length, 0);

        // Fetch total commission
        const commissions = await Commission.find({ recipientId: userId });
        const totalCommission = commissions.reduce((acc, curr) => acc + curr.amountUsdt, 0);

        res.json({
            summary: {
                totalF1,
                totalF2,
                totalReferrals: totalF1 + totalF2,
                totalCommission
            },
            network
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Validate referral code
// @route   GET /api/auth/validate-referral/:username
// @access  Public
export const validateReferral = async (req, res) => {
    try {
        const { username } = req.params;
        const user = await User.findOne({ username: username.toLowerCase(), isDeleted: false });

        if (!user) {
            return res.status(404).json({ message: 'auth.errors.invalid_referral', valid: false });
        }

        // Check qualification: must have paid >= 30% of pledge
        if (user.pledgeUsdt > 0) {
            const payPercent = (user.paidUsdtPreRegister / user.pledgeUsdt) * 100;
            if (payPercent < 30) {
                return res.status(400).json({ 
                    message: 'auth.errors.referral_not_qualified', 
                    valid: false,
                    reason: 'payment_insufficient'
                });
            }
        } else {
            return res.status(400).json({ 
                message: 'auth.errors.referral_not_qualified', 
                valid: false,
                reason: 'no_pledge'
            });
        }

        res.json({ valid: true, fullName: user.fullName });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Forgot Password - Send Email
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email, isDeleted: false });

        if (!user) {
            return res.status(404).json({ message: 'auth.errors.email_not_found' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        await sendResetPasswordEmail(user.email, resetToken, user.fullName);

        res.json({ message: 'auth.forgot_password_success_desc' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password/:token
// @access  Public
export const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const user = await User.findOne({ 
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() },
            isDeleted: false
        });

        if (!user) {
            return res.status(400).json({ message: 'auth.errors.invalid_reset_token' });
        }

        user.password = password;
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();

        res.json({ message: 'auth.reset_password_success_desc' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
