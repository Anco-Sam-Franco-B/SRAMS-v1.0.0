import express from 'express';
import { forgotPassword, resetPassword, changePassword } from '../../controllers/auth.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Authenticated
router.post('/change-password', authenticate, changePassword);

export default router;
