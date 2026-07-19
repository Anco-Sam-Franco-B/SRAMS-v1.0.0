import pool from '../config/db.js';
import logger from '../config/logger.js';

const AcademicYearController = {
  async getAll(req, res) {
    try {
      const { rows } = await pool.query('SELECT * FROM academic_years ORDER BY start_date DESC');
      return res.status(200).json({ data: rows });
    } catch (error) {
      logger.error('Error fetching academic years:', error);
      return res.status(500).json({ error: 'Failed to fetch academic years' });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      const { rows } = await pool.query('SELECT * FROM academic_years WHERE id=$1', [id]);
      if (!rows[0]) {
        return res.status(404).json({ error: 'Academic year not found' });
      }
      return res.status(200).json({ data: rows[0] });
    } catch (error) {
      logger.error('Error fetching academic year:', error);
      return res.status(500).json({ error: 'Failed to fetch academic year' });
    }
  },

  async create(req, res) {
    try {
      const { name, start_date, end_date, is_current } = req.body;
      const { rows } = await pool.query(
        'INSERT INTO academic_years (name, start_date, end_date, is_current) VALUES ($1,$2,$3,$4) RETURNING *',
        [name, start_date, end_date, is_current]
      );
      return res.status(201).json({ data: rows[0], message: 'Created' });
    } catch (error) {
      logger.error('Error creating academic year:', error);
      return res.status(500).json({ error: 'Failed to create academic year' });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, start_date, end_date, is_current } = req.body;
      const { rows } = await pool.query(
        'UPDATE academic_years SET name=$1, start_date=$2, end_date=$3, is_current=$4 WHERE id=$5 RETURNING *',
        [name, start_date, end_date, is_current, id]
      );
      if (!rows[0]) {
        return res.status(404).json({ error: 'Academic year not found' });
      }
      return res.status(200).json({ data: rows[0], message: 'Updated' });
    } catch (error) {
      logger.error('Error updating academic year:', error);
      return res.status(500).json({ error: 'Failed to update academic year' });
    }
  },

  async remove(req, res) {
    try {
      const { id } = req.params;
      await pool.query('DELETE FROM academic_years WHERE id=$1', [id]);
      return res.status(200).json({ message: 'Deleted' });
    } catch (error) {
      logger.error('Error deleting academic year:', error);
      return res.status(500).json({ error: 'Failed to delete academic year' });
    }
  },

  async setCurrent(req, res) {
    try {
      const { id } = req.params;
      await pool.query('UPDATE academic_years SET is_current = false');
      await pool.query('UPDATE academic_years SET is_current = true WHERE id=$1', [id]);
      return res.status(200).json({ message: 'Updated' });
    } catch (error) {
      logger.error('Error setting current academic year:', error);
      return res.status(500).json({ error: 'Failed to set current academic year' });
    }
  }
};

export const { getAll, getById, create, update, remove, setCurrent } = AcademicYearController;
export default AcademicYearController;
