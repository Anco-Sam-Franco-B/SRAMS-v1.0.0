import pool from '../config/db.js';
import logger from '../config/logger.js';

const TermController = {
  async getAll(req, res) {
    try {
      const { academic_year_id } = req.query;
      let query = `
        SELECT t.*, ay.name as academic_year_name
        FROM terms t
        LEFT JOIN academic_years ay ON t.academic_year_id = ay.id
      `;
      const params = [];
      if (academic_year_id) {
        query += ' WHERE t.academic_year_id = $1';
        params.push(academic_year_id);
      }
      query += ' ORDER BY t.start_date DESC';
      const { rows } = await pool.query(query, params);
      return res.status(200).json({ data: rows });
    } catch (error) {
      logger.error('Error fetching terms:', error);
      return res.status(500).json({ error: 'Failed to fetch terms' });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      const { rows } = await pool.query(
        `SELECT t.*, ay.name as academic_year_name
         FROM terms t
         LEFT JOIN academic_years ay ON t.academic_year_id = ay.id
         WHERE t.id = $1`,
        [id]
      );
      if (!rows[0]) {
        return res.status(404).json({ error: 'Term not found' });
      }
      return res.status(200).json({ data: rows[0] });
    } catch (error) {
      logger.error('Error fetching term:', error);
      return res.status(500).json({ error: 'Failed to fetch term' });
    }
  },

  async create(req, res) {
    try {
      const { academic_year_id, name, start_date, end_date, is_current } = req.body;
      const { rows } = await pool.query(
        'INSERT INTO terms (academic_year_id, name, start_date, end_date, is_current) VALUES ($1,$2,$3,$4,$5) RETURNING *',
        [academic_year_id, name, start_date, end_date, is_current]
      );
      return res.status(201).json({ data: rows[0], message: 'Created' });
    } catch (error) {
      logger.error('Error creating term:', error);
      return res.status(500).json({ error: 'Failed to create term' });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { academic_year_id, name, start_date, end_date, is_current } = req.body;
      const { rows } = await pool.query(
        'UPDATE terms SET academic_year_id=$1, name=$2, start_date=$3, end_date=$4, is_current=$5 WHERE id=$6 RETURNING *',
        [academic_year_id, name, start_date, end_date, is_current, id]
      );
      if (!rows[0]) {
        return res.status(404).json({ error: 'Term not found' });
      }
      return res.status(200).json({ data: rows[0], message: 'Updated' });
    } catch (error) {
      logger.error('Error updating term:', error);
      return res.status(500).json({ error: 'Failed to update term' });
    }
  },

  async remove(req, res) {
    try {
      const { id } = req.params;
      await pool.query('DELETE FROM terms WHERE id=$1', [id]);
      return res.status(200).json({ message: 'Deleted' });
    } catch (error) {
      logger.error('Error deleting term:', error);
      return res.status(500).json({ error: 'Failed to delete term' });
    }
  },

  async setCurrent(req, res) {
    try {
      const { id } = req.params;
      await pool.query(
        'UPDATE terms SET is_current = false WHERE academic_year_id=(SELECT academic_year_id FROM terms WHERE id=$1)',
        [id]
      );
      await pool.query('UPDATE terms SET is_current = true WHERE id=$1', [id]);
      return res.status(200).json({ message: 'Updated' });
    } catch (error) {
      logger.error('Error setting current term:', error);
      return res.status(500).json({ error: 'Failed to set current term' });
    }
  }
};

export const { getAll, getById, create, update, remove, setCurrent } = TermController;
export default TermController;
