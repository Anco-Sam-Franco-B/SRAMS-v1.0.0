import express from 'express'
import {
  createAccount, getCurrentUser, login, logout, refreshToken,
  forgotPassword, resetPassword, verifyEmail, resendVerification,
  changePassword, enable2FA, confirm2FA, disable2FA, verify2FA,
  sendOtp, verifyOtp
} from '../../controllers/auth.controller.js'
import { authenticate } from '../../middleware/auth.middleware.js'
import { validateRegister, validateLogin } from '../../middleware/validation.js'

const authRouter = express.Router()

// Public routes
authRouter.post('/register', validateRegister, createAccount)
authRouter.post('/login', validateLogin, login)
authRouter.post('/refresh', refreshToken)
authRouter.post('/logout', logout)
authRouter.get('/me', authenticate, getCurrentUser)

// Password management
authRouter.post('/forgot-password', forgotPassword)
authRouter.post('/reset-password', resetPassword)
authRouter.post('/change-password', authenticate, changePassword)

// Email verification
authRouter.get('/verify-email/:token', verifyEmail)
authRouter.post('/resend-verification', resendVerification)

// 2FA
authRouter.post('/2fa/enable', authenticate, enable2FA)
authRouter.post('/2fa/confirm', authenticate, confirm2FA)
authRouter.post('/2fa/disable', authenticate, disable2FA)
authRouter.post('/2fa/verify', verify2FA)

// OTP
authRouter.post('/otp/send', authenticate, sendOtp)
authRouter.post('/otp/verify', authenticate, verifyOtp)

export default authRouter
