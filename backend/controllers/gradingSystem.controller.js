import pool from '../config/db.js';
import logger from '../config/logger.js';

const GradingSystemController = {
  async getAll(req, res) {
    try {
      const { rows } = await pool.query('SELECT * FROM grading_system ORDER BY min_mark DESC');
      return res.status(200).json({ data: rows });
    } catch (error) {
      logger.error('Error fetching grading systems:', error);
      return res.status(500).json({ error: 'Failed to fetch grading systems' });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      const { rows } = await pool.query('SELECT * FROM grading_system WHERE id=$1', [id]);
      if (!rows[0]) {
        return res.status(404).json({ error: 'Grading system not found' });
      }
      return res.status(200).json({ data: rows[0] });
    } catch (error) {
      logger.error('Error fetching grading system:', error);
      return res.status(500).json({ error: 'Failed to fetch grading system' });
    }
  },

  async create(req, res) {
    try {
      const { grade, min_mark, max_mark, remarks } = req.body;
      const { rows } = await pool.query(
        'INSERT INTO grading_system (grade, min_mark, max_mark, remarks) VALUES ($1,$2,$3,$4) RETURNING *',
        [grade, min_mark, max_mark, remarks]
      );
      return res.status(201).json({ data: rows[0], message: 'Created' });
    } catch (error) {
      logger.error('Error creating grading system:', error);
      return res.status(500).json({ error: 'Failed to create grading system' });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { grade, min_mark, max_mark, remarks } = req.body;
      const { rows } = await pool.query(
        'UPDATE grading_system SET grade=$1, min_mark=$2, max_mark=$3, remarks=$4 WHERE id=$5 RETURNING *',
        [grade, min_mark, max_mark, remarks, id]
      );
      if (!rows[0]) {
        return res.status(404).json({ error: 'Grading system not found' });
      }
      return res.status(200).json({ data: rows[0], message: 'Updated' });
    } catch (error) {
      logger.error('Error updating grading system:', error);
      return res.status(500).json({ error: 'Failed to update grading system' });
    }
  },

  async remove(req, res) {
    try {
      const { id } = req.params;
      await pool.query('DELETE FROM grading_system WHERE id=$1', [id]);
      return res.status(200).json({ message: 'Deleted' });
    } catch (error) {
      logger.error('Error deleting grading system:', error);
      return res.status(500).json({ error: 'Failed to delete grading system' });
    }
  }
};

export const { getAll, getById, create, update, remove } = GradingSystemController;
export default GradingSystemController;
