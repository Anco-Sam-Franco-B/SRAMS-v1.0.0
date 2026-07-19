import pool from '../config/db.js';
import logger from '../config/logger.js';

export const getAll = async (req, res) => {
  try {
    const { subject_id, class_id, type } = req.query;
    let query = `
      SELECT c.*, s.name as subject_name, cl.name as class_name,
        (SELECT COUNT(*) FROM curriculum_materials cm WHERE cm.curriculum_id = c.id) as material_count
      FROM curriculum c
      LEFT JOIN subjects s ON c.subject_id = s.id
      LEFT JOIN classes cl ON c.class_id = cl.id
      WHERE 1=1
    `;
    const params = [];
    if (subject_id) { params.push(subject_id); query += ` AND c.subject_id = $${params.length}`; }
    if (class_id) { params.push(class_id); query += ` AND c.class_id = $${params.length}`; }
    if (type) { params.push(type); query += ` AND c.type = $${params.length}`; }
    query += ' ORDER BY c.created_at DESC';
    const { rows } = await pool.query(query, params);
    res.json({ data: rows });
  } catch (error) {
    logger.error('Error fetching curriculum', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch curriculum' });
  }
};

export const create = async (req, res) => {
  try {
    const { name, type, subject_id, class_id, description } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO curriculum (name, type, subject_id, class_id, description, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, type, subject_id, class_id, description, req.user.id]
    );
    res.status(201).json({ data: rows[0] });
  } catch (error) {
    logger.error('Error creating curriculum', { error: error.message });
    res.status(500).json({ error: 'Failed to create curriculum' });
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, description } = req.body;
    const { rows } = await pool.query(
      `UPDATE curriculum SET name = COALESCE($1, name), type = COALESCE($2, type),
       description = COALESCE($3, description) WHERE id = $4 RETURNING *`,
      [name, type, description, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Curriculum not found' });
    res.json({ data: rows[0] });
  } catch (error) {
    logger.error('Error updating curriculum', { error: error.message });
    res.status(500).json({ error: 'Failed to update curriculum' });
  }
};

export const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM curriculum WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Curriculum not found' });
    res.json({ message: 'Curriculum deleted' });
  } catch (error) {
    logger.error('Error deleting curriculum', { error: error.message });
    res.status(500).json({ error: 'Failed to delete curriculum' });
  }
};

export const getMaterials = async (req, res) => {
  try {
    const { curriculum_id } = req.query;
    let query = 'SELECT * FROM curriculum_materials WHERE 1=1';
    const params = [];
    if (curriculum_id) { params.push(curriculum_id); query += ` AND curriculum_id = $${params.length}`; }
    query += ' ORDER BY created_at DESC';
    const { rows } = await pool.query(query, params);
    res.json({ data: rows });
  } catch (error) {
    logger.error('Error fetching materials', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch materials' });
  }
};

export const addMaterial = async (req, res) => {
  try {
    const { curriculum_id, title, material_type, file_url } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO curriculum_materials (curriculum_id, title, material_type, file_url)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [curriculum_id, title, material_type, file_url]
    );
    res.status(201).json({ data: rows[0] });
  } catch (error) {
    logger.error('Error adding material', { error: error.message });
    res.status(500).json({ error: 'Failed to add material' });
  }
};
