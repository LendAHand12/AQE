import express from 'express';
import { registerUser, loginUser, confirmEmail, getUserProfile, updateUserProfile, updateFaceTecStatus, submitIdVerification, getReferrals, getSubReferrals, forgotPassword, resetPassword, generate2FA, enable2FA, disable2FA, verify2FALogin, recordWalletConnection } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import { convertHeicToJpg } from '../middleware/heicConverter.js';

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
router.get('/referrals/:userId', protect, getSubReferrals);
router.post('/kyc-status', protect, updateFaceTecStatus);
router.get('/2fa/generate', protect, generate2FA);
router.post('/2fa/enable', protect, enable2FA);
router.post('/2fa/disable', protect, disable2FA);
router.post('/verify-id', protect, submitIdVerification);

// User Profile Routes
router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

// Wallet Connection History
router.post('/wallet-connections', protect, recordWalletConnection);

// Upload route
router.post('/upload', protect, (req, res) => {
    upload.single('image')(req, res, async (err) => {
        if (err) {
            let errMsg = 'errors.upload_failed';
            if (err.code === 'LIMIT_FILE_SIZE') {
                errMsg = 'errors.file_too_large';
            } else if (err.message && err.message.includes('Only images')) {
                errMsg = 'errors.only_images_allowed';
            }
            return res.status(400).json({ message: errMsg });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'errors.select_image_required' });
        }

        try {
            let nextCalled = false;
            await convertHeicToJpg(req, res, () => { nextCalled = true; });
            if (!nextCalled) return; // Response already sent due to an error in conversion
        } catch (convErr) {
            if (!res.headersSent) {
                return res.status(400).json({ message: 'errors.upload_failed' });
            }
            return;
        }

        const imageUrl = `/uploads/${req.file.filename}`;
        res.json({ imageUrl });
    });
});

export default router;
