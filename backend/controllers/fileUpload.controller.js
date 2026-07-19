import pool from '../config/db.js';
import logger from '../config/logger.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';

export const upload = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    const { entityType, entityId } = req.params;
    const buffer = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    const result = await uploadToCloudinary(buffer, entityType);
    const { rows } = await pool.query(
      `INSERT INTO file_uploads (entity_type, entity_id, file_name, file_url, file_type, file_size, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [entityType, entityId, req.file.originalname, result.url, req.file.mimetype, req.file.size, req.user.id]
    );
    res.status(201).json({ data: rows[0] });
  } catch (error) {
    logger.error('Error uploading file', { error: error.message });
    res.status(500).json({ error: 'Failed to upload file' });
  }
};

export const getFiles = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const { rows } = await pool.query(
      'SELECT * FROM file_uploads WHERE entity_type = $1 AND entity_id = $2 ORDER BY created_at DESC',
      [entityType, entityId]
    );
    res.json({ data: rows });
  } catch (error) {
    logger.error('Error fetching files', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch files' });
  }
};

export const deleteFile = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('DELETE FROM file_uploads WHERE id = $1 RETURNING *', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'File not found' });
    try { await deleteFromCloudinary(rows[0].file_url); } catch {}
    res.json({ message: 'File deleted' });
  } catch (error) {
    logger.error('Error deleting file', { error: error.message });
    res.status(500).json({ error: 'Failed to delete file' });
  }
};
