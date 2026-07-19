import pool from '../config/db.js';
import logger from '../config/logger.js';

export const getAll = async (req, res) => {
  try {
    let query = `SELECT c.*, sub.name as subject_name FROM competencies c LEFT JOIN subjects sub ON c.subject_id = sub.id`;
    const conditions = [];
    const values = [];
    let idx = 1;
    if (req.query.subject_id) { conditions.push(`c.subject_id = $${idx++}`); values.push(req.query.subject_id); }
    if (conditions.length > 0) query += ` WHERE ${conditions.join(' AND ')}`;
    query += ` ORDER BY c.name`;

    const { rows } = await pool.query(query, values);
    res.json({ data: rows });
  } catch (error) {
    logger.error('Failed to fetch competencies:', error);
    res.status(500).json({ error: 'Failed to fetch competencies' });
  }
};

export const create = async (req, res) => {
  try {
    const { name, description, subject_id } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO competencies (name, description, subject_id) VALUES ($1, $2, $3) RETURNING *',
      [name, description, subject_id || null]
    );
    res.status(201).json({ data: rows[0], message: 'Created' });
  } catch (error) {
    logger.error('Failed to create competency:', error);
    res.status(500).json({ error: 'Failed to create competency' });
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, subject_id } = req.body;
    const { rows } = await pool.query(
      'UPDATE competencies SET name=$1, description=$2, subject_id=$3 WHERE id=$4 RETURNING *',
      [name, description, subject_id || null, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ data: rows[0], message: 'Updated' });
  } catch (error) {
    logger.error('Failed to update competency:', error);
    res.status(500).json({ error: 'Failed to update competency' });
  }
};

export const remove = async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM competencies WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (error) {
    logger.error('Failed to delete competency:', error);
    res.status(500).json({ error: 'Failed to delete competency' });
  }
};
