import pool from '../config/db.js'
import logger from '../config/logger.js';
import { sendEmail } from '../services/emailService.js';
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { logAudit } from '../utils/auditLog.js';
import { validatePasswordStrength, savePasswordHistory, checkPasswordHistory } from '../utils/passwordValidator.js';

const SALT_ROUNDS = 12;
const LOCK_THRESHOLD = 5;
const LOCK_MINUTES = 15;

// ============================================================
// Token Generation Helpers
// ============================================================
const generateAccessToken = (user) => {
  return jwt.sign({ id: user.id, role: user.role, email: user.email }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = (user) => {
  return jwt.sign({ id: user.id, type: 'refresh' }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' });
};

const storeRefreshToken = async (userId, token, req) => {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await pool.query(
    `INSERT INTO user_sessions (user_id, refresh_token, device_info, ip_address, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, token, req?.headers?.['user-agent'] || 'unknown', req?.ip || null, expiresAt]
  );
};

const setTokenCookies = (res, accessToken, refreshToken, rememberMe) => {
  const accessMaxAge = 15 * 60 * 1000; // 15 minutes
  const refreshMaxAge = rememberMe ? 90 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: accessMaxAge
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: refreshMaxAge,
    path: '/api/v1/auth'
  });
};

// ============================================================
// CREATE ACCOUNT
// ============================================================
export const createAccount = async (req, res) => {
  const { fname, lname, email, password } = req.body;

  if (!fname || !lname || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const strength = validatePasswordStrength(password);
  if (!strength.isValid) {
    return res.status(400).json({ message: 'Password too weak', errors: strength.errors });
  }

  const existingUser = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
  if (existingUser.rows.length > 0) {
    return res.status(409).json({ message: 'Email already exists' });
  }

  try {
    const roles = await pool.query(`SELECT id, name FROM roles WHERE name='Visitor'`);
    const role = roles.rows[0];

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const result = await pool.query(
      `INSERT INTO users(role_id, first_name, last_name, email, password_hash, verification_token)
       VALUES($1, $2, $3, $4, $5, $6)
       RETURNING id, first_name, last_name, email, role_id`,
      [role.id, fname, lname, email, passwordHash, verificationToken]
    );

    // Save to password history
    await savePasswordHistory(result.rows[0].id, passwordHash);

    // Send verification email
    try {
      await sendEmail({
        to: email,
        subject: 'Verify Your Email - SRAMS',
        template: 'account-created',
        data: {
          name: fname + ' ' + lname,
          email,
          role: role.name,
          loginUrl: `http://localhost:5173/verify-email?token=${verificationToken}`
        }
      });
    } catch (e) {
      logger.warn('Email sending failed', { error: e.message });
    }

    logger.info('Account created successfully', { userId: result.rows[0].id });
    return res.status(201).json({ message: 'Account created successfully', user: result.rows[0] });
  } catch (error) {
    logger.error('Create Account Error:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ============================================================
// LOGIN
// ============================================================
export const login = async (req, res) => {
  const { email, password, rememberMe } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const result = await pool.query(
      `SELECT users.*, roles.name AS role
       FROM users LEFT JOIN roles ON users.role_id = roles.id
       WHERE users.email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Check account lockout
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const remaining = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
      return res.status(423).json({ message: `Account locked. Try again in ${remaining} minutes.` });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      // Increment login attempts
      const attempts = (user.login_attempts || 0) + 1;
      const lockUntil = attempts >= LOCK_THRESHOLD
        ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000)
        : null;

      await pool.query(
        'UPDATE users SET login_attempts = $1, locked_until = $2 WHERE id = $3',
        [attempts, lockUntil, user.id]
      );

      await logAudit(user.id, 'LOGIN_FAILED', 'user', user.id, null, { attempts }, req);

      if (attempts >= LOCK_THRESHOLD) {
        return res.status(423).json({ message: 'Account locked due to too many failed attempts. Try again later.' });
      }

      return res.status(401).json({ message: 'Invalid email or password', attempts_remaining: LOCK_THRESHOLD - attempts });
    }

    // Reset login attempts on success
    await pool.query(
      'UPDATE users SET login_attempts = 0, locked_until = NULL, last_login_at = NOW() WHERE id = $1',
      [user.id]
    );

    // Check if 2FA is enabled
    if (user.two_factor_enabled) {
      const tempToken = jwt.sign({ id: user.id, role: user.role, type: 'temp_2fa' }, process.env.JWT_SECRET, { expiresIn: '5m' });
      return res.status(200).json({
        requires2FA: true,
        tempToken,
        user: { id: user.id, first_name: user.first_name, last_name: user.last_name, email: user.email, role: user.role }
      });
    }

    // Generate token pair
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await storeRefreshToken(user.id, refreshToken, req);
    setTokenCookies(res, accessToken, refreshToken, rememberMe);

    await logAudit(user.id, 'LOGIN_SUCCESS', 'user', user.id, null, { method: 'password' }, req);

    return res.status(200).json({
      message: 'Login successful',
      user: { id: user.id, first_name: user.first_name, last_name: user.last_name, email: user.email, role: user.role }
    });
  } catch (error) {
    logger.error('Login error:', error.message);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// ============================================================
// REFRESH TOKEN
// ============================================================
export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ message: 'No refresh token' });
    }

    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

    // Check session exists and is active
    const { rows } = await pool.query(
      'SELECT * FROM user_sessions WHERE refresh_token = $1 AND user_id = $2 AND is_active = true',
      [token, decoded.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid session' });
    }

    // Get user
    const userResult = await pool.query(
      `SELECT users.*, roles.name AS role FROM users LEFT JOIN roles ON users.role_id = roles.id WHERE users.id = $1`,
      [decoded.id]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    const user = userResult.rows[0];

    // Rotate: invalidate old, issue new pair
    await pool.query('UPDATE user_sessions SET is_active = false WHERE refresh_token = $1', [token]);

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    await storeRefreshToken(user.id, newRefreshToken, req);
    setTokenCookies(res, newAccessToken, newRefreshToken, false);

    return res.status(200).json({ message: 'Tokens refreshed' });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Refresh token expired' });
    }
    return res.status(500).json({ message: 'Token refresh failed' });
  }
};

// ============================================================
// LOGOUT
// ============================================================
export const logout = async (req, res) => {
  try {
    // Invalidate current session
    const token = req.cookies?.refreshToken;
    if (token) {
      await pool.query('UPDATE user_sessions SET is_active = false WHERE refresh_token = $1', [token]);
    }
  } catch (error) {
    logger.error('Logout error:', error.message);
  }

  res.clearCookie('accessToken', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
  res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/api/v1/auth' });

  return res.status(200).json({ message: 'Logged out successfully' });
};

// ============================================================
// GET CURRENT USER
// ============================================================
export const getCurrentUser = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT users.id, users.first_name, users.last_name, users.email, users.phone, users.avatar_url,
              users.email_verified, users.two_factor_enabled,
              roles.name AS role
       FROM users LEFT JOIN roles ON roles.id = users.role_id
       WHERE users.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];

    // If student, get student info
    if (user.role === 'Student') {
      const studentResult = await pool.query(
        'SELECT id, admission_no, class_id, trade_id FROM students WHERE user_id = $1',
        [req.user.id]
      );
      if (studentResult.rows.length > 0) {
        user.studentId = studentResult.rows[0].id;
        user.admission_no = studentResult.rows[0].admission_no;
        user.class_id = studentResult.rows[0].class_id;
        user.trade_id = studentResult.rows[0].trade_id;
      }
    }

    // If teacher, get teacher info
    if (user.role === 'Teacher' || user.role === 'Class Teacher') {
      const teacherResult = await pool.query(
        'SELECT id, trade_id, employee_no FROM teachers WHERE user_id = $1',
        [req.user.id]
      );
      if (teacherResult.rows.length > 0) {
        user.teacherId = teacherResult.rows[0].id;
        user.trade_id = teacherResult.rows[0].trade_id;
        user.employee_no = teacherResult.rows[0].employee_no;
      }
    }

    res.status(200).json({ user });
  } catch (error) {
    logger.error('Get user error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ============================================================
// FORGOT PASSWORD
// ============================================================
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const { rows } = await pool.query('SELECT id, first_name, last_name FROM users WHERE email = $1', [email]);
    if (rows.length === 0) {
      // Don't reveal whether email exists
      return res.status(200).json({ message: 'If the email exists, a reset link has been sent.' });
    }

    const user = rows[0];
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [resetToken, resetExpires, user.id]
    );

    try {
      await sendEmail({
        to: email,
        subject: 'Reset Your Password - SRAMS',
        template: 'reset-password',
        data: {
          name: user.first_name + ' ' + user.last_name,
          resetUrl: `http://localhost:5173/reset-password?token=${resetToken}`
        }
      });
    } catch (e) {
      logger.warn('Reset email failed', { error: e.message });
    }

    res.status(200).json({ message: 'If the email exists, a reset link has been sent.' });
  } catch (error) {
    logger.error('Forgot password error:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ============================================================
// RESET PASSWORD
// ============================================================
export const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ message: 'Token and password are required' });

  const strength = validatePasswordStrength(password);
  if (!strength.isValid) {
    return res.status(400).json({ message: 'Password too weak', errors: strength.errors });
  }

  try {
    const { rows } = await pool.query(
      'SELECT id, reset_token_expires FROM users WHERE reset_token = $1',
      [token]
    );

    if (rows.length === 0 || new Date(rows[0].reset_token_expires) < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const userId = rows[0].id;

    // Check password history
    const newHash = await bcrypt.hash(password, SALT_ROUNDS);
    const isNewPassword = await checkPasswordHistory(userId, newHash);
    if (!isNewPassword) {
      return res.status(400).json({ message: 'Cannot reuse recent passwords' });
    }

    await pool.query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL, password_changed_at = NOW() WHERE id = $2',
      [newHash, userId]
    );

    await savePasswordHistory(userId, newHash);

    // Invalidate all sessions
    await pool.query('UPDATE user_sessions SET is_active = false WHERE user_id = $1', [userId]);

    await logAudit(userId, 'PASSWORD_RESET', 'user', userId, null, {}, req);

    res.status(200).json({ message: 'Password reset successful. Please login.' });
  } catch (error) {
    logger.error('Reset password error:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ============================================================
// EMAIL VERIFICATION
// ============================================================
export const verifyEmail = async (req, res) => {
  const { token } = req.params;
  try {
    const { rows } = await pool.query('SELECT id FROM users WHERE verification_token = $1', [token]);
    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid verification token' });
    }

    await pool.query('UPDATE users SET email_verified = true, verification_token = NULL WHERE id = $1', [rows[0].id]);
    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    logger.error('Email verification error:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const resendVerification = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const { rows } = await pool.query('SELECT id, first_name, last_name, email_verified FROM users WHERE email = $1', [email]);
    if (rows.length === 0) return res.status(200).json({ message: 'If the email exists, a verification link has been sent.' });
    if (rows[0].email_verified) return res.status(400).json({ message: 'Email already verified' });

    const verificationToken = crypto.randomBytes(32).toString('hex');
    await pool.query('UPDATE users SET verification_token = $1 WHERE id = $2', [verificationToken, rows[0].id]);

    try {
      await sendEmail({
        to: email,
        subject: 'Verify Your Email - SRAMS',
        template: 'account-created',
        data: {
          name: rows[0].first_name + ' ' + rows[0].last_name,
          loginUrl: `http://localhost:5173/verify-email?token=${verificationToken}`
        }
      });
    } catch (e) {
      logger.warn('Verification email failed', { error: e.message });
    }

    res.status(200).json({ message: 'If the email exists, a verification link has been sent.' });
  } catch (error) {
    logger.error('Resend verification error:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ============================================================
// OTP (Email-based)
// ============================================================
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

export const sendOtp = async (req, res) => {
  const { type } = req.body; // 'login' | 'reset' | 'verify'
  try {
    const { rows } = await pool.query('SELECT id, email, first_name FROM users WHERE id = $1', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });

    const user = rows[0];
    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate old OTPs
    await pool.query('UPDATE otp_codes SET used = true WHERE user_id = $1 AND type = $2 AND used = false', [user.id, type || 'login']);

    // Store new OTP
    await pool.query(
      'INSERT INTO otp_codes (user_id, code, type, expires_at) VALUES ($1, $2, $3, $4)',
      [user.id, code, type || 'login', expiresAt]
    );

    try {
      await sendEmail({
        to: user.email,
        subject: `Your OTP Code - SRAMS`,
        template: 'otp',
        data: { name: user.first_name, code, expiresIn: '10 minutes' }
      });
    } catch (e) {
      logger.warn('OTP email failed', { error: e.message });
    }

    res.status(200).json({ message: 'OTP sent to your email' });
  } catch (error) {
    logger.error('Send OTP error:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const verifyOtp = async (req, res) => {
  const { code, type } = req.body;
  if (!code) return res.status(400).json({ message: 'OTP code is required' });

  try {
    const { rows } = await pool.query(
      `SELECT * FROM otp_codes
       WHERE user_id = $1 AND code = $2 AND type = $3 AND used = false AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [req.user.id, code, type || 'login']
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Mark as used
    await pool.query('UPDATE otp_codes SET used = true WHERE id = $1', [rows[0].id]);

    res.status(200).json({ message: 'OTP verified successfully' });
  } catch (error) {
    logger.error('Verify OTP error:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ============================================================
// TWO-FACTOR AUTHENTICATION
// ============================================================
export const enable2FA = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id FROM users WHERE id = $1', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });

    // Generate a simple TOTP secret (in production, use speakeasy)
    const secret = crypto.randomBytes(20).toString('hex');

    await pool.query(
      'UPDATE users SET two_factor_secret = $1, two_factor_method = $2 WHERE id = $3',
      [secret, 'email', req.user.id]
    );

    res.status(200).json({ message: '2FA setup initiated. Verify with OTP to complete.', secret });
  } catch (error) {
    logger.error('Enable 2FA error:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const confirm2FA = async (req, res) => {
  const { code } = req.body;
  try {
    const { rows } = await pool.query(
      `SELECT * FROM otp_codes
       WHERE user_id = $1 AND code = $2 AND type = '2fa_setup' AND used = false AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [req.user.id, code]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid OTP. Complete 2FA setup failed.' });
    }

    await pool.query('UPDATE otp_codes SET used = true WHERE id = $1', [rows[0].id]);
    await pool.query('UPDATE users SET two_factor_enabled = true WHERE id = $1', [req.user.id]);

    await logAudit(req.user.id, '2FA_ENABLED', 'user', req.user.id, null, {}, req);

    res.status(200).json({ message: 'Two-factor authentication enabled' });
  } catch (error) {
    logger.error('Confirm 2FA error:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const disable2FA = async (req, res) => {
  try {
    await pool.query('UPDATE users SET two_factor_enabled = false, two_factor_secret = NULL WHERE id = $1', [req.user.id]);
    await logAudit(req.user.id, '2FA_DISABLED', 'user', req.user.id, null, {}, req);
    res.status(200).json({ message: 'Two-factor authentication disabled' });
  } catch (error) {
    logger.error('Disable 2FA error:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const verify2FA = async (req, res) => {
  const { tempToken, code } = req.body;
  if (!tempToken || !code) return res.status(400).json({ message: 'Token and code are required' });

  try {
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    if (decoded.type !== 'temp_2fa') return res.status(400).json({ message: 'Invalid token type' });

    const { rows } = await pool.query(
      `SELECT * FROM otp_codes
       WHERE user_id = $1 AND code = $2 AND type = '2fa_login' AND used = false AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [decoded.id, code]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid OTP code' });
    }

    await pool.query('UPDATE otp_codes SET used = true WHERE id = $1', [rows[0].id]);

    // Issue full tokens
    const userResult = await pool.query(
      `SELECT users.*, roles.name AS role FROM users LEFT JOIN roles ON users.role_id = roles.id WHERE users.id = $1`,
      [decoded.id]
    );

    const user = userResult.rows[0];
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await storeRefreshToken(user.id, refreshToken, req);
    setTokenCookies(res, accessToken, refreshToken, false);

    await logAudit(user.id, 'LOGIN_SUCCESS_2FA', 'user', user.id, null, { method: '2fa' }, req);

    return res.status(200).json({
      message: 'Login successful',
      user: { id: user.id, first_name: user.first_name, last_name: user.last_name, email: user.email, role: user.role }
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Temp token expired. Please login again.' });
    }
    logger.error('Verify 2FA error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// ============================================================
// CHANGE PASSWORD (authenticated)
// ============================================================
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current and new password are required' });
  }

  const strength = validatePasswordStrength(newPassword);
  if (!strength.isValid) {
    return res.status(400).json({ message: 'New password too weak', errors: strength.errors });
  }

  try {
    const { rows } = await pool.query('SELECT id, password_hash FROM users WHERE id = $1', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });

    const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!valid) return res.status(400).json({ message: 'Current password is incorrect' });

    const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Check password history
    const isNew = await checkPasswordHistory(req.user.id, newHash);
    if (!isNew) {
      return res.status(400).json({ message: 'Cannot reuse a recent password' });
    }

    await pool.query('UPDATE users SET password_hash = $1, password_changed_at = NOW() WHERE id = $2', [newHash, req.user.id]);
    await savePasswordHistory(req.user.id, newHash);

    await logAudit(req.user.id, 'PASSWORD_CHANGED', 'user', req.user.id, null, {}, req);

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    logger.error('Change password error:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};
