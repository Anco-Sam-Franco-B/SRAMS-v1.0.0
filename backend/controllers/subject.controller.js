import pool from '../config/db.js';
import logger from '../config/logger.js';

const SubjectController = {
  async getAll(req, res) {
    try {
      const { trade_id, class_id } = req.query;
      let query = `
        SELECT s.*, t.name as trade_name, c.name as class_name
        FROM subjects s
        LEFT JOIN trade t ON s.trade_id = t.id
        LEFT JOIN classes c ON s.class_id = c.id
      `;
      const conditions = [];
      const params = [];
      let paramIndex = 1;

      if (trade_id) {
        conditions.push(`s.trade_id = $${paramIndex}`);
        params.push(trade_id);
        paramIndex++;
      }
      if (class_id) {
        conditions.push(`s.class_id = $${paramIndex}`);
        params.push(class_id);
        paramIndex++;
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      query += ' ORDER BY s.name';

      const { rows } = await pool.query(query, params);
      return res.status(200).json({ data: rows });
    } catch (error) {
      logger.error('Error fetching subjects:', error);
      return res.status(500).json({ error: 'Failed to fetch subjects' });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      const { rows } = await pool.query(
        `SELECT s.*, t.name as trade_name, c.name as class_name
         FROM subjects s
         LEFT JOIN trade t ON s.trade_id = t.id
         LEFT JOIN classes c ON s.class_id = c.id
         WHERE s.id = $1`,
        [id]
      );
      if (!rows[0]) {
        return res.status(404).json({ error: 'Subject not found' });
      }
      return res.status(200).json({ data: rows[0] });
    } catch (error) {
      logger.error('Error fetching subject:', error);
      return res.status(500).json({ error: 'Failed to fetch subject' });
    }
  },

  async create(req, res) {
    try {
      const { trade_id, class_id, code, name, weight } = req.body;
      const { rows } = await pool.query(
        'INSERT INTO subjects (trade_id, class_id, code, name, weight) VALUES ($1,$2,$3,$4,$5) RETURNING *',
        [trade_id, class_id, code, name, weight]
      );
      return res.status(201).json({ data: rows[0], message: 'Created' });
    } catch (error) {
      logger.error('Error creating subject:', error);
      return res.status(500).json({ error: 'Failed to create subject' });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { trade_id, class_id, code, name, weight } = req.body;
      const { rows } = await pool.query(
        'UPDATE subjects SET trade_id=$1, class_id=$2, code=$3, name=$4, weight=$5 WHERE id=$6 RETURNING *',
        [trade_id, class_id, code, name, weight, id]
      );
      if (!rows[0]) {
        return res.status(404).json({ error: 'Subject not found' });
      }
      return res.status(200).json({ data: rows[0], message: 'Updated' });
    } catch (error) {
      logger.error('Error updating subject:', error);
      return res.status(500).json({ error: 'Failed to update subject' });
    }
  },

  async remove(req, res) {
    try {
      const { id } = req.params;
      await pool.query('DELETE FROM subjects WHERE id=$1', [id]);
      return res.status(200).json({ message: 'Deleted' });
    } catch (error) {
      logger.error('Error deleting subject:', error);
      return res.status(500).json({ error: 'Failed to delete subject' });
    }
  }
};

export const { getAll, getById, create, update, remove } = SubjectController;
export default SubjectController;
