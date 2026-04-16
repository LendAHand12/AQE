import express from 'express';
import { 
    loginAdmin, 
    getUsers, 
    updateUserByAdmin, 
    deleteUser
} from '../controllers/adminController.js';
import { adminProtect } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', loginAdmin);

// Protected Admin Routes
router.route('/users')
    .get(adminProtect, getUsers);

router.route('/users/:id')
    .put(adminProtect, updateUserByAdmin)
    .delete(adminProtect, deleteUser);

export default router;
