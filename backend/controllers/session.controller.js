import pool from '../config/db.js';
import logger from '../config/logger.js';

// GET /api/v1/sessions — list active sessions for current user
export const listSessions = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, device_info, ip_address, is_active, created_at, last_active_at
       FROM user_sessions
       WHERE user_id = $1
       ORDER BY last_active_at DESC`,
      [req.user.id]
    );
    res.json({ data: rows });
  } catch (error) {
    logger.error('Failed to list sessions', { error: error.message });
    res.status(500).json({ error: 'Failed to list sessions' });
  }
};

// DELETE /api/v1/sessions/:id — revoke a specific session
export const revokeSession = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(
      'UPDATE user_sessions SET is_active = false WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    res.json({ message: 'Session revoked' });
  } catch (error) {
    logger.error('Failed to revoke session', { error: error.message });
    res.status(500).json({ error: 'Failed to revoke session' });
  }
};

// DELETE /api/v1/sessions — revoke all other sessions
export const revokeAllSessions = async (req, res) => {
  try {
    await pool.query(
      'UPDATE user_sessions SET is_active = false WHERE user_id = $1',
      [req.user.id]
    );
    res.json({ message: 'All sessions revoked' });
  } catch (error) {
    logger.error('Failed to revoke all sessions', { error: error.message });
    res.status(500).json({ error: 'Failed to revoke sessions' });
  }
};
