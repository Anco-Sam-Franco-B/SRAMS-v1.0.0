import pool from '../config/db.js';
import logger from '../config/logger.js';

export const getProfile = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM school_profile ORDER BY created_at DESC LIMIT 1');
    res.json({ data: rows[0] || null });
  } catch (error) {
    logger.error('Failed to fetch school profile:', error);
    res.status(500).json({ error: 'Failed to fetch school profile' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, motto, logo_url, address, phone, email, website, district, province, country } = req.body;
    const { rows } = await pool.query(
      `UPDATE school_profile SET name=$1, motto=$2, logo_url=$3, address=$4, phone=$5, email=$6, website=$7, district=$8, province=$9, country=$10, updated_at=NOW()
       WHERE id = (SELECT id FROM school_profile ORDER BY created_at DESC LIMIT 1)
       RETURNING *`,
      [name, motto, logo_url, address, phone, email, website, district, province, country]
    );
    if (rows.length === 0) {
      const insert = await pool.query(
        `INSERT INTO school_profile(name, motto, logo_url, address, phone, email, website, district, province, country) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
        [name, motto, logo_url, address, phone, email, website, district, province, country]
      );
      return res.json({ data: insert.rows[0], message: 'Created' });
    }
    res.json({ data: rows[0], message: 'Updated' });
  } catch (error) {
    logger.error('Failed to update school profile:', error);
    res.status(500).json({ error: 'Failed to update school profile' });
  }
};
