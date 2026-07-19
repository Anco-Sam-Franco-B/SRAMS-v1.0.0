import pool from '../config/db.js';
import logger from '../config/logger.js';

export const getAll = async (req, res) => {
  try {
    const { status, period } = req.query;
    let query = 'SELECT * FROM imihigo WHERE 1=1';
    const params = [];
    if (status) { params.push(status); query += ` AND status = $${params.length}`; }
    if (period) { params.push(period); query += ` AND period = $${params.length}`; }
    query += ' ORDER BY created_at DESC';
    const { rows } = await pool.query(query, params);
    res.json({ data: rows });
  } catch (error) {
    logger.error('Error fetching imihigo', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch imihigo' });
  }
};

export const create = async (req, res) => {
  try {
    const { title, description, target_value, period } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO imihigo (title, description, target_value, period, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [title, description, target_value, period, req.user.id]
    );
    res.status(201).json({ data: rows[0] });
  } catch (error) {
    logger.error('Error creating imihigo', { error: error.message });
    res.status(500).json({ error: 'Failed to create imihigo' });
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, target_value, actual_value, status } = req.body;
    const { rows } = await pool.query(
      `UPDATE imihigo SET title = COALESCE($1, title), description = COALESCE($2, description),
       target_value = COALESCE($3, target_value), actual_value = COALESCE($4, actual_value),
       status = COALESCE($5, status) WHERE id = $6 RETURNING *`,
      [title, description, target_value, actual_value, status, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Imihigo not found' });
    res.json({ data: rows[0] });
  } catch (error) {
    logger.error('Error updating imihigo', { error: error.message });
    res.status(500).json({ error: 'Failed to update imihigo' });
  }
};

export const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM imihigo WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Imihigo not found' });
    res.json({ message: 'Imihigo deleted' });
  } catch (error) {
    logger.error('Error deleting imihigo', { error: error.message });
    res.status(500).json({ error: 'Failed to delete imihigo' });
  }
};

export const getVideos = async (req, res) => {
  try {
    const { imihigo_id } = req.query;
    let query = 'SELECT * FROM imihigo_videos WHERE 1=1';
    const params = [];
    if (imihigo_id) { params.push(imihigo_id); query += ` AND imihigo_id = $${params.length}`; }
    query += ' ORDER BY created_at DESC';
    const { rows } = await pool.query(query, params);
    res.json({ data: rows });
  } catch (error) {
    logger.error('Error fetching videos', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
};

export const addVideo = async (req, res) => {
  try {
    const { imihigo_id, title, video_url, description } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO imihigo_videos (imihigo_id, title, video_url, description)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [imihigo_id, title, video_url, description]
    );
    res.status(201).json({ data: rows[0] });
  } catch (error) {
    logger.error('Error adding video', { error: error.message });
    res.status(500).json({ error: 'Failed to add video' });
  }
};
