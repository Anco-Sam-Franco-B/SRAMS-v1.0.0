import pool from '../config/db.js';
import logger from '../config/logger.js';

export const getAll = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM streams ORDER BY name');
    res.json({ data: rows });
  } catch (error) {
    logger.error('Failed to fetch streams:', error);
    res.status(500).json({ error: 'Failed to fetch streams' });
  }
};

export const create = async (req, res) => {
  try {
    const { name, code, description } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO streams (name, code, description) VALUES ($1, $2, $3) RETURNING *',
      [name, code, description]
    );
    res.status(201).json({ data: rows[0], message: 'Created' });
  } catch (error) {
    logger.error('Failed to create stream:', error);
    res.status(500).json({ error: 'Failed to create stream' });
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description } = req.body;
    const { rows } = await pool.query(
      'UPDATE streams SET name=$1, code=$2, description=$3 WHERE id=$4 RETURNING *',
      [name, code, description, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ data: rows[0], message: 'Updated' });
  } catch (error) {
    logger.error('Failed to update stream:', error);
    res.status(500).json({ error: 'Failed to update stream' });
  }
};

export const remove = async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM streams WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (error) {
    logger.error('Failed to delete stream:', error);
    res.status(500).json({ error: 'Failed to delete stream' });
  }
};
