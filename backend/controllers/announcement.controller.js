import pool from '../config/db.js';
import logger from '../config/logger.js';
import { broadcastAnnouncement } from '../services/socketService.js';

export const getAll = async (req, res) => {
  try {
    const { audience, published } = req.query;
    let query = 'SELECT a.*, u.first_name || \' \' || u.last_name as created_by_name FROM announcements a LEFT JOIN users u ON a.created_by = u.id WHERE 1=1';
    const params = [];
    if (published !== undefined) { params.push(published === 'true'); query += ` AND a.published = $${params.length}`; }
    if (audience) { params.push(audience); query += ` AND ($${params.length} = ANY(a.audience) OR 'all' = ANY(a.audience))`; }
    query += ' ORDER BY a.created_at DESC';
    const { rows } = await pool.query(query, params);
    res.json({ data: rows });
  } catch (error) {
    logger.error('Error fetching announcements', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
};

export const create = async (req, res) => {
  try {
    const { title, content, audience, priority, expires_at } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO announcements (title, content, audience, priority, expires_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, content, audience || ['all'], priority || 'normal', expires_at, req.user.id]
    );
    res.status(201).json({ data: rows[0] });
  } catch (error) {
    logger.error('Error creating announcement', { error: error.message });
    res.status(500).json({ error: 'Failed to create announcement' });
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, audience, priority, expires_at } = req.body;
    const { rows } = await pool.query(
      `UPDATE announcements SET title = COALESCE($1, title), content = COALESCE($2, content),
       audience = COALESCE($3, audience), priority = COALESCE($4, priority),
       expires_at = COALESCE($5, expires_at) WHERE id = $6 RETURNING *`,
      [title, content, audience, priority, expires_at, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Announcement not found' });
    res.json({ data: rows[0] });
  } catch (error) {
    logger.error('Error updating announcement', { error: error.message });
    res.status(500).json({ error: 'Failed to update announcement' });
  }
};

export const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM announcements WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Announcement not found' });
    res.json({ message: 'Announcement deleted' });
  } catch (error) {
    logger.error('Error deleting announcement', { error: error.message });
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
};

export const publish = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `UPDATE announcements SET published = true, published_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`, [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Announcement not found' });
    broadcastAnnouncement(rows[0], rows[0].audience);
    res.json({ data: rows[0] });
  } catch (error) {
    logger.error('Error publishing announcement', { error: error.message });
    res.status(500).json({ error: 'Failed to publish announcement' });
  }
};
