import pool from '../config/db.js';
import logger from '../config/logger.js';

export const getAll = async (req, res) => {
  try {
    let query = `
      SELECT t.*, c.name as class_name, sub.name as subject_name,
             u.first_name || ' ' || u.last_name as teacher_name,
             cr.name as classroom_name, ay.name as academic_year_name,
             tm.name as term_name
      FROM timetables t
      LEFT JOIN classes c ON t.class_id = c.id
      LEFT JOIN subjects sub ON t.subject_id = sub.id
      LEFT JOIN teachers te ON t.teacher_id = te.id
      LEFT JOIN users u ON te.user_id = u.id
      LEFT JOIN classrooms cr ON t.classroom_id = cr.id
      LEFT JOIN academic_years ay ON t.academic_year_id = ay.id
      LEFT JOIN terms tm ON t.term_id = tm.id
    `;
    const conditions = [];
    const values = [];
    let idx = 1;

    if (req.query.class_id) { conditions.push(`t.class_id = $${idx++}`); values.push(req.query.class_id); }
    if (req.query.teacher_id) { conditions.push(`t.teacher_id = $${idx++}`); values.push(req.query.teacher_id); }
    if (req.query.academic_year_id) { conditions.push(`t.academic_year_id = $${idx++}`); values.push(req.query.academic_year_id); }
    if (req.query.term_id) { conditions.push(`t.term_id = $${idx++}`); values.push(req.query.term_id); }

    if (conditions.length > 0) query += ` WHERE ${conditions.join(' AND ')}`;
    query += ` ORDER BY
      CASE t.day_of_week
        WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3
        WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6
        WHEN 'Sunday' THEN 7 ELSE 8 END, t.start_time`;

    const { rows } = await pool.query(query, values);
    res.json({ data: rows });
  } catch (error) {
    logger.error('Failed to fetch timetable:', error);
    res.status(500).json({ error: 'Failed to fetch timetable' });
  }
};

export const create = async (req, res) => {
  try {
    const { class_id, subject_id, teacher_id, classroom_id, academic_year_id, term_id, day_of_week, start_time, end_time } = req.body;

    // Check for conflicts
    const conflict = await pool.query(
      `SELECT id FROM timetables
       WHERE class_id = $1 AND academic_year_id = $2 AND term_id = $3 AND day_of_week = $4
       AND ((start_time <= $5 AND end_time > $5) OR (start_time < $6 AND end_time >= $6) OR (start_time >= $5 AND end_time <= $6))`,
      [class_id, academic_year_id, term_id, day_of_week, start_time, end_time]
    );

    if (conflict.rows.length > 0) {
      return res.status(409).json({ error: 'Time slot conflict' });
    }

    const { rows } = await pool.query(
      `INSERT INTO timetables (class_id, subject_id, teacher_id, classroom_id, academic_year_id, term_id, day_of_week, start_time, end_time)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [class_id, subject_id, teacher_id, classroom_id, academic_year_id, term_id, day_of_week, start_time, end_time]
    );
    res.status(201).json({ data: rows[0], message: 'Created' });
  } catch (error) {
    logger.error('Failed to create timetable entry:', error);
    res.status(500).json({ error: 'Failed to create timetable entry' });
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { class_id, subject_id, teacher_id, classroom_id, academic_year_id, term_id, day_of_week, start_time, end_time } = req.body;
    const { rows } = await pool.query(
      `UPDATE timetables SET class_id=$1, subject_id=$2, teacher_id=$3, classroom_id=$4, academic_year_id=$5, term_id=$6, day_of_week=$7, start_time=$8, end_time=$9 WHERE id=$10 RETURNING *`,
      [class_id, subject_id, teacher_id, classroom_id, academic_year_id, term_id, day_of_week, start_time, end_time, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ data: rows[0], message: 'Updated' });
  } catch (error) {
    logger.error('Failed to update timetable:', error);
    res.status(500).json({ error: 'Failed to update timetable' });
  }
};

export const remove = async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM timetables WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (error) {
    logger.error('Failed to delete timetable:', error);
    res.status(500).json({ error: 'Failed to delete timetable' });
  }
};
