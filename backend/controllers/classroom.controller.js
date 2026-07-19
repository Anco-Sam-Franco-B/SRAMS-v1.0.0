import pool from '../config/db.js';
import logger from '../config/logger.js';

export const getAll = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM classrooms ORDER BY name');
    res.json({ data: rows });
  } catch (error) {
    logger.error('Failed to fetch classrooms:', error);
    res.status(500).json({ error: 'Failed to fetch classrooms' });
  }
};

export const create = async (req, res) => {
  try {
    const { name, code, capacity, building, room_type } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO classrooms (name, code, capacity, building, room_type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, code, capacity, building, room_type]
    );
    res.status(201).json({ data: rows[0], message: 'Created' });
  } catch (error) {
    logger.error('Failed to create classroom:', error);
    res.status(500).json({ error: 'Failed to create classroom' });
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, capacity, building, room_type } = req.body;
    const { rows } = await pool.query(
      'UPDATE classrooms SET name=$1, code=$2, capacity=$3, building=$4, room_type=$5 WHERE id=$6 RETURNING *',
      [name, code, capacity, building, room_type, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ data: rows[0], message: 'Updated' });
  } catch (error) {
    logger.error('Failed to update classroom:', error);
    res.status(500).json({ error: 'Failed to update classroom' });
  }
};

export const remove = async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM classrooms WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (error) {
    logger.error('Failed to delete classroom:', error);
    res.status(500).json({ error: 'Failed to delete classroom' });
  }
};
