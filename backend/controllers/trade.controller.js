import pool from '../config/db.js';
import logger from '../config/logger.js';

const TradeController = {
  async getAll(req, res) {
    try {
      const { rows } = await pool.query('SELECT * FROM trade ORDER BY name');
      return res.status(200).json({ data: rows });
    } catch (error) {
      logger.error('Error fetching trades:', error);
      return res.status(500).json({ error: 'Failed to fetch trades' });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      const { rows } = await pool.query('SELECT * FROM trade WHERE id = $1', [id]);
      if (!rows[0]) {
        return res.status(404).json({ error: 'Trade not found' });
      }
      return res.status(200).json({ data: rows[0] });
    } catch (error) {
      logger.error('Error fetching trade:', error);
      return res.status(500).json({ error: 'Failed to fetch trade' });
    }
  },

  async create(req, res) {
    try {
      const { code, name } = req.body;
      const { rows } = await pool.query(
        'INSERT INTO trade (code, name) VALUES ($1, $2) RETURNING *',
        [code, name]
      );
      return res.status(201).json({ data: rows[0], message: 'Created' });
    } catch (error) {
      logger.error('Error creating trade:', error);
      return res.status(500).json({ error: 'Failed to create trade' });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { code, name } = req.body;
      const { rows } = await pool.query(
        'UPDATE trade SET code=$1, name=$2 WHERE id=$3 RETURNING *',
        [code, name, id]
      );
      if (!rows[0]) {
        return res.status(404).json({ error: 'Trade not found' });
      }
      return res.status(200).json({ data: rows[0], message: 'Updated' });
    } catch (error) {
      logger.error('Error updating trade:', error);
      return res.status(500).json({ error: 'Failed to update trade' });
    }
  },

  async remove(req, res) {
    try {
      const { id } = req.params;
      await pool.query('DELETE FROM trade WHERE id=$1', [id]);
      return res.status(200).json({ message: 'Deleted' });
    } catch (error) {
      logger.error('Error deleting trade:', error);
      return res.status(500).json({ error: 'Failed to delete trade' });
    }
  }
};

export const { getAll, getById, create, update, remove } = TradeController;
export default TradeController;
