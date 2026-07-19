import pool from '../config/db.js';
import logger from '../config/logger.js';

export const getAll = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT d.*, t.first_name || ' ' || t.last_name as head_teacher_name
       FROM departments d
       LEFT JOIN teachers t ON d.head_teacher_id = t.id
       LEFT JOIN users u ON t.user_id = u.id
       ORDER BY d.name`
    );
    res.json({ data: rows });
  } catch (error) {
    logger.error('Failed to fetch departments:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
};

export const create = async (req, res) => {
  try {
    const { name, code, head_teacher_id } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO departments (name, code, head_teacher_id) VALUES ($1, $2, $3) RETURNING *',
      [name, code, head_teacher_id || null]
    );
    res.status(201).json({ data: rows[0], message: 'Created' });
  } catch (error) {
    logger.error('Failed to create department:', error);
    res.status(500).json({ error: 'Failed to create department' });
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, head_teacher_id } = req.body;
    const { rows } = await pool.query(
      'UPDATE departments SET name=$1, code=$2, head_teacher_id=$3 WHERE id=$4 RETURNING *',
      [name, code, head_teacher_id || null, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ data: rows[0], message: 'Updated' });
  } catch (error) {
    logger.error('Failed to update department:', error);
    res.status(500).json({ error: 'Failed to update department' });
  }
};

export const remove = async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM departments WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (error) {
    logger.error('Failed to delete department:', error);
    res.status(500).json({ error: 'Failed to delete department' });
  }
};
