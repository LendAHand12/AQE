import express from 'express';
import { 
    loginAdmin, 
    getUsers, 
    updateUserByAdmin, 
    deleteUser
} from '../controllers/adminController.js';
import { updateTokenSettings, getExplorerStats } from '../controllers/blockchainController.js';
import { getAdminLogs } from '../controllers/logController.js';
import { adminProtect } from '../middleware/auth.js';
import { getAllTransactionsForAdmin } from '../controllers/paymentController.js';

const router = express.Router();

router.post('/login', loginAdmin);

// Protected Admin Routes
router.route('/users')
    .get(adminProtect, getUsers);

router.route('/users/:id')
    .put(adminProtect, updateUserByAdmin)
    .delete(adminProtect, deleteUser);

router.route('/token-settings')
    .get(adminProtect, getExplorerStats)
    .put(adminProtect, updateTokenSettings);

router.get('/logs', adminProtect, getAdminLogs);
router.get('/transactions', adminProtect, getAllTransactionsForAdmin);

export default router;
