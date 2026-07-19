import pool from '../config/db.js';
import logger from '../config/logger.js';

export const getAll = async (req, res) => {
  try {
    const { entity_type, academic_year_id, term_id } = req.query;
    let query = 'SELECT * FROM submission_progress WHERE 1=1';
    const params = [];
    if (entity_type) { params.push(entity_type); query += ` AND entity_type = $${params.length}`; }
    if (academic_year_id) { params.push(academic_year_id); query += ` AND academic_year_id = $${params.length}`; }
    if (term_id) { params.push(term_id); query += ` AND term_id = $${params.length}`; }
    query += ' ORDER BY created_at DESC';
    const { rows } = await pool.query(query, params);
    res.json({ data: rows });
  } catch (error) {
    logger.error('Error fetching submissions', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
};

export const create = async (req, res) => {
  try {
    const { entity_type, entity_name, academic_year_id, term_id, total_items, deadline } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO submission_progress (entity_type, entity_name, academic_year_id, term_id, total_items, deadline)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [entity_type, entity_name, academic_year_id, term_id, total_items, deadline]
    );
    res.status(201).json({ data: rows[0] });
  } catch (error) {
    logger.error('Error creating submission', { error: error.message });
    res.status(500).json({ error: 'Failed to create submission' });
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { submitted_items, status, total_items } = req.body;
    const { rows } = await pool.query(
      `UPDATE submission_progress SET submitted_items = COALESCE($1, submitted_items),
       status = COALESCE($2, status), total_items = COALESCE($3, total_items)
       WHERE id = $4 RETURNING *`,
      [submitted_items, status, total_items, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Submission not found' });
    res.json({ data: rows[0] });
  } catch (error) {
    logger.error('Error updating submission', { error: error.message });
    res.status(500).json({ error: 'Failed to update submission' });
  }
};

export const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM submission_progress WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Submission not found' });
    res.json({ message: 'Submission deleted' });
  } catch (error) {
    logger.error('Error deleting submission', { error: error.message });
    res.status(500).json({ error: 'Failed to delete submission' });
  }
};
