import pool from '../config/db.js';
import logger from '../config/logger.js';

const ClassController = {
  async getAll(req, res) {
    try { 
      const { trade_id } = req.query;
      let query = `
        SELECT c.*, t.name as trade_name
        FROM classes c
        LEFT JOIN trade t ON c.trade_id = t.id
      `;
      const params = [];
      if (trade_id) {
        query += ' WHERE c.trade_id = $1';
        params.push(trade_id);
      }
      query += ' ORDER BY c.name';
      const { rows } = await pool.query(query, params);
      return res.status(200).json({ data: rows });
    } catch (error) {
      logger.error('Error fetching classes:', error);
      return res.status(500).json({ error: 'Failed to fetch classes' });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      const { rows } = await pool.query(
        `SELECT c.*, t.name as trade_name
         FROM classes c
         LEFT JOIN trade t ON c.trade_id = t.id
         WHERE c.id = $1`,
        [id]
      );
      if (!rows[0]) {
        return res.status(404).json({ error: 'Class not found' });
      }
      return res.status(200).json({ data: rows[0] });
    } catch (error) {
      logger.error('Error fetching class:', error);
      return res.status(500).json({ error: 'Failed to fetch class' });
    }
  },

  async create(req, res) {
    try {
      const { trade_id, name, level, capacity } = req.body;
      const { rows } = await pool.query(
        'INSERT INTO classes (trade_id, name, level, capacity) VALUES ($1,$2,$3,$4) RETURNING *',
        [trade_id, name, level, capacity]
      );
      return res.status(201).json({ data: rows[0], message: 'Created' });
    } catch (error) {
      logger.error('Error creating class:', error);
      return res.status(500).json({ error: 'Failed to create class' });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { trade_id, name, level, capacity } = req.body;
      const { rows } = await pool.query(
        'UPDATE classes SET trade_id=$1, name=$2, level=$3, capacity=$4 WHERE id=$5 RETURNING *',
        [trade_id, name, level, capacity, id]
      );
      if (!rows[0]) {
        return res.status(404).json({ error: 'Class not found' });
      }
      return res.status(200).json({ data: rows[0], message: 'Updated' });
    } catch (error) {
      logger.error('Error updating class:', error);
      return res.status(500).json({ error: 'Failed to update class' });
    }
  },

  async remove(req, res) {
    try {
      const { id } = req.params;
      await pool.query('DELETE FROM classes WHERE id=$1', [id]);
      return res.status(200).json({ message: 'Deleted' });
    } catch (error) {
      logger.error('Error deleting class:', error);
      return res.status(500).json({ error: 'Failed to delete class' });
    }
  }
};

export const { getAll, getById, create, update, remove } = ClassController;
export default ClassController;
