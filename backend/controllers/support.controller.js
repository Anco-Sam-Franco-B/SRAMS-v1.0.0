import pool from '../config/db.js';
import logger from '../config/logger.js';

export const getAll = async (req, res) => {
  try {
    const { status, user_id } = req.query;
    let query = `
      SELECT st.*, u.first_name || ' ' || u.last_name as user_name,
        a.first_name || ' ' || a.last_name as assigned_name
      FROM support_tickets st
      LEFT JOIN users u ON st.user_id = u.id
      LEFT JOIN users a ON st.assigned_to = a.id
      WHERE 1=1
    `;
    const params = [];
    if (status) { params.push(status); query += ` AND st.status = $${params.length}`; }
    if (user_id) { params.push(user_id); query += ` AND st.user_id = $${params.length}`; }
    query += ' ORDER BY st.created_at DESC';
    const { rows } = await pool.query(query, params);
    res.json({ data: rows });
  } catch (error) {
    logger.error('Error fetching support tickets', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch support tickets' });
  }
};

export const create = async (req, res) => {
  try {
    const { subject, description, priority } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO support_tickets (user_id, subject, description, priority)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user.id, subject, description, priority || 'normal']
    );
    res.status(201).json({ data: rows[0] });
  } catch (error) {
    logger.error('Error creating support ticket', { error: error.message });
    res.status(500).json({ error: 'Failed to create support ticket' });
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assigned_to, priority } = req.body;
    const { rows } = await pool.query(
      `UPDATE support_tickets SET status = COALESCE($1, status),
       assigned_to = COALESCE($2, assigned_to), priority = COALESCE($3, priority),
       updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *`,
      [status, assigned_to, priority, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Ticket not found' });
    res.json({ data: rows[0] });
  } catch (error) {
    logger.error('Error updating support ticket', { error: error.message });
    res.status(500).json({ error: 'Failed to update support ticket' });
  }
};

export const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM support_tickets WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Ticket not found' });
    res.json({ message: 'Ticket deleted' });
  } catch (error) {
    logger.error('Error deleting support ticket', { error: error.message });
    res.status(500).json({ error: 'Failed to delete ticket' });
  }
};
