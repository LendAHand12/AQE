import express from 'express';
import { registerUser, loginUser, confirmEmail, getUserProfile, updateUserProfile, updateFaceTecStatus, submitIdVerification, getReferrals, forgotPassword, resetPassword, generate2FA, enable2FA, disable2FA, verify2FALogin } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/login/2fa', verify2FALogin);
router.get('/confirm/:token', confirmEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/validate-referral/:username', (req, res, next) => {
    // We'll implement this in the controller, but first add the import
    import('../controllers/authController.js').then(m => m.validateReferral(req, res)).catch(next);
});
router.get('/referrals', protect, getReferrals);
router.post('/kyc-status', protect, updateFaceTecStatus);
router.get('/2fa/generate', protect, generate2FA);
router.post('/2fa/enable', protect, enable2FA);
router.post('/2fa/disable', protect, disable2FA);
router.post('/verify-id', protect, submitIdVerification);

// User Profile Routes
router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

// Upload route
router.post('/upload', protect, (req, res) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            return res.status(400).json({ message: err.message });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'Vui lòng chọn ảnh' });
        }
        const imageUrl = `/uploads/${req.file.filename}`;
        res.json({ imageUrl });
    });
});

export default router;
