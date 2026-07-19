import pool from '../config/db.js';
import logger from '../config/logger.js';

export const getInbox = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT m.*, u.first_name || ' ' || u.last_name as sender_name, r.name as sender_role
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE m.recipient_id = $1
      ORDER BY m.created_at DESC
    `, [req.user.id]);
    res.json({ data: rows });
  } catch (error) {
    logger.error('Error fetching inbox', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch inbox' });
  }
};

export const getSent = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT m.*, u.first_name || ' ' || u.last_name as recipient_name
      FROM messages m
      LEFT JOIN users u ON m.recipient_id = u.id
      WHERE m.sender_id = $1
      ORDER BY m.created_at DESC
    `, [req.user.id]);
    res.json({ data: rows });
  } catch (error) {
    logger.error('Error fetching sent messages', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch sent messages' });
  }
};

export const send = async (req, res) => {
  try {
    const { recipient_id, subject, body, parent_message_id } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO messages (sender_id, recipient_id, subject, body, parent_message_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.id, recipient_id, subject, body, parent_message_id]
    );
    res.status(201).json({ data: rows[0] });
  } catch (error) {
    logger.error('Error sending message', { error: error.message });
    res.status(500).json({ error: 'Failed to send message' });
  }
};

export const markRead = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `UPDATE messages SET is_read = true WHERE id = $1 AND recipient_id = $2 RETURNING *`,
      [id, req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Message not found' });
    res.json({ data: rows[0] });
  } catch (error) {
    logger.error('Error marking message read', { error: error.message });
    res.status(500).json({ error: 'Failed to mark message' });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT COUNT(*) as count FROM messages WHERE recipient_id = $1 AND is_read = false',
      [req.user.id]
    );
    res.json({ data: { count: Number(rows[0].count) } });
  } catch (error) {
    logger.error('Error counting unread messages', { error: error.message });
    res.status(500).json({ error: 'Failed to count messages' });
  }
};

export const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query(
      'DELETE FROM messages WHERE id = $1 AND (sender_id = $2 OR recipient_id = $2)',
      [id, req.user.id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Message not found' });
    res.json({ message: 'Message deleted' });
  } catch (error) {
    logger.error('Error deleting message', { error: error.message });
    res.status(500).json({ error: 'Failed to delete message' });
  }
};
