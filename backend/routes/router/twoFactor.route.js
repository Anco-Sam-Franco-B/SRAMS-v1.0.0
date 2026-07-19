import express from 'express';
import { enable2FA, confirm2FA, disable2FA, verify2FA, sendOtp, verifyOtp } from '../../controllers/auth.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = express.Router();

router.post('/enable', authenticate, enable2FA);
router.post('/confirm', authenticate, confirm2FA);
router.post('/disable', authenticate, disable2FA);
router.post('/verify', verify2FA); // Uses temp token, not full auth

// OTP routes
router.post('/send-otp', authenticate, sendOtp);
router.post('/verify-otp', authenticate, verifyOtp);

export default router;
