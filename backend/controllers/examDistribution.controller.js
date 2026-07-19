import pool from '../config/db.js';
import logger from '../config/logger.js';

export const getAll = async (req, res) => {
  try {
    const { exam_type, class_id, subject_id, term_id } = req.query;
    let query = `
      SELECT ep.*, s.name as subject_name, c.name as class_name,
        t.name as term_name, ay.name as year_name
      FROM exam_papers ep
      LEFT JOIN subjects s ON ep.subject_id = s.id
      LEFT JOIN classes c ON ep.class_id = c.id
      LEFT JOIN terms t ON ep.term_id = t.id
      LEFT JOIN academic_years ay ON ep.academic_year_id = ay.id
      WHERE 1=1
    `;
    const params = [];
    if (exam_type) { params.push(exam_type); query += ` AND ep.exam_type = $${params.length}`; }
    if (class_id) { params.push(class_id); query += ` AND ep.class_id = $${params.length}`; }
    if (subject_id) { params.push(subject_id); query += ` AND ep.subject_id = $${params.length}`; }
    if (term_id) { params.push(term_id); query += ` AND ep.term_id = $${params.length}`; }
    query += ' ORDER BY ep.created_at DESC';
    const { rows } = await pool.query(query, params);
    res.json({ data: rows });
  } catch (error) {
    logger.error('Error fetching exam papers', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch exam papers' });
  }
};

export const create = async (req, res) => {
  try {
    const { exam_type, title, subject_id, class_id, academic_year_id, term_id, total_marks, duration_minutes } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO exam_papers (exam_type, title, subject_id, class_id, academic_year_id, term_id, total_marks, duration_minutes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [exam_type, title, subject_id, class_id, academic_year_id, term_id, total_marks || 100, duration_minutes, req.user.id]
    );
    res.status(201).json({ data: rows[0] });
  } catch (error) {
    logger.error('Error creating exam paper', { error: error.message });
    res.status(500).json({ error: 'Failed to create exam paper' });
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, exam_type, status, total_marks, duration_minutes } = req.body;
    const { rows } = await pool.query(
      `UPDATE exam_papers SET title = COALESCE($1, title), exam_type = COALESCE($2, exam_type),
       status = COALESCE($3, status), total_marks = COALESCE($4, total_marks),
       duration_minutes = COALESCE($5, duration_minutes) WHERE id = $6 RETURNING *`,
      [title, exam_type, status, total_marks, duration_minutes, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Exam paper not found' });
    res.json({ data: rows[0] });
  } catch (error) {
    logger.error('Error updating exam paper', { error: error.message });
    res.status(500).json({ error: 'Failed to update exam paper' });
  }
};

export const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM exam_papers WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Exam paper not found' });
    res.json({ message: 'Exam paper deleted' });
  } catch (error) {
    logger.error('Error deleting exam paper', { error: error.message });
    res.status(500).json({ error: 'Failed to delete exam paper' });
  }
};

export const getDistributions = async (req, res) => {
  try {
    const { exam_paper_id } = req.query;
    let query = `
      SELECT ed.*, ep.title as exam_title, cr.name as classroom_name,
        u.first_name || ' ' || u.last_name as distributed_to_name
      FROM exam_distributions ed
      LEFT JOIN exam_papers ep ON ed.exam_paper_id = ep.id
      LEFT JOIN classrooms cr ON ed.classroom_id = cr.id
      LEFT JOIN users u ON ed.distributed_to = u.id
      WHERE 1=1
    `;
    const params = [];
    if (exam_paper_id) { params.push(exam_paper_id); query += ` AND ed.exam_paper_id = $${params.length}`; }
    query += ' ORDER BY ed.created_at DESC';
    const { rows } = await pool.query(query, params);
    res.json({ data: rows });
  } catch (error) {
    logger.error('Error fetching distributions', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch distributions' });
  }
};

export const createDistribution = async (req, res) => {
  try {
    const { exam_paper_id, classroom_id, distributed_to } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO exam_distributions (exam_paper_id, classroom_id, distributed_to, distributed_at, status)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP, 'distributed') RETURNING *`,
      [exam_paper_id, classroom_id, distributed_to]
    );
    res.status(201).json({ data: rows[0] });
  } catch (error) {
    logger.error('Error creating distribution', { error: error.message });
    res.status(500).json({ error: 'Failed to create distribution' });
  }
};
