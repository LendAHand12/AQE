import express from 'express';
import { 
    loginAdmin, 
    verify2FALogin,
    getUsers, 
    getUserStats,
    updateUserByAdmin, 
    deleteUser,
    getUserById,
    generate2FA,
    enable2FA,
    disable2FA,
    getDashboardStats
} from '../controllers/adminController.js';
import { updateTokenSettings, getExplorerStats } from '../controllers/blockchainController.js';
import { getAdminLogs } from '../controllers/logController.js';
import { adminProtect } from '../middleware/auth.js';
import { getAllTransactionsForAdmin } from '../controllers/paymentController.js';
import { 
    createProperty, 
    getProperties, 
    getPropertyById,
    updateProperty, 
    deleteProperty 
} from '../controllers/propertyController.js';
import { upload } from '../middleware/uploadMiddleware.js';


const router = express.Router();

router.post('/login', loginAdmin);
router.post('/login/2fa', verify2FALogin);

// Protected Admin Routes
router.route('/users')
    .get(adminProtect, getUsers);

router.get('/users/stats', adminProtect, getUserStats);
router.get('/dashboard-stats', adminProtect, getDashboardStats);


router.route('/users/:id')
    .get(adminProtect, getUserById)
    .put(adminProtect, updateUserByAdmin)
    .delete(adminProtect, deleteUser);

router.route('/token-settings')
    .get(adminProtect, getExplorerStats)
    .put(adminProtect, updateTokenSettings);

router.get('/logs', adminProtect, getAdminLogs);
router.get('/transactions', adminProtect, getAllTransactionsForAdmin);

router.get('/2fa/generate', adminProtect, generate2FA);
router.post('/2fa/enable', adminProtect, enable2FA);
router.post('/2fa/disable', adminProtect, disable2FA);

// Properties Management
router.route('/properties')
    .get(adminProtect, getProperties)
    .post(adminProtect, upload.array('images', 10), createProperty);

router.route('/properties/:id')
    .get(adminProtect, getPropertyById)
    .put(adminProtect, upload.array('images', 10), updateProperty)
    .delete(adminProtect, deleteProperty);


export default router;
