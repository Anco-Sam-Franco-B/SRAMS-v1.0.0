import pool from '../config/db.js';
import logger from '../config/logger.js';

export const getAll = async (req, res) => {
  try {
    let query = `
      SELECT att.*, s.first_name, s.last_name, s.admission_no,
             c.name as class_name, sub.name as subject_name, t.name as term_name
      FROM attendance att
      LEFT JOIN students s ON att.student_id = s.id
      LEFT JOIN classes c ON att.class_id = c.id
      LEFT JOIN subjects sub ON att.subject_id = sub.id
      LEFT JOIN terms t ON att.term_id = t.id
    `;
    const conditions = [];
    const values = [];
    let index = 1;

    if (req.query.student_id) {
      conditions.push(`att.student_id = $${index++}`);
      values.push(req.query.student_id);
    }
    if (req.query.class_id) {
      conditions.push(`att.class_id = $${index++}`);
      values.push(req.query.class_id);
    }
    if (req.query.subject_id) {
      conditions.push(`att.subject_id = $${index++}`);
      values.push(req.query.subject_id);
    }
    if (req.query.trade_id) {
      conditions.push(`att.trade_id = $${index++}`);
      values.push(req.query.trade_id);
    }
    if (req.query.term_id) {
      conditions.push(`att.term_id = $${index++}`);
      values.push(req.query.term_id);
    }
    if (req.query.start_date) {
      conditions.push(`att.attendance_date >= $${index++}`);
      values.push(req.query.start_date);
    }
    if (req.query.end_date) {
      conditions.push(`att.attendance_date <= $${index++}`);
      values.push(req.query.end_date);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY att.attendance_date DESC`;

    const { rows } = await pool.query(query, values);
    res.json({ data: rows });
  } catch (error) {
    logger.error('Failed to fetch attendance:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
};

export const markAttendance = async (req, res) => {
  const client = await pool.connect();
  try {
    const { attendance } = req.body;
    let count = 0;

    await client.query('BEGIN');

    for (const record of attendance) {
      const { student_id, teacher_id, class_id, term_id, subject_id, trade_id, attendance_date, status } = record;
      const { rowCount } = await client.query(
        `INSERT INTO attendance (student_id, teacher_id, class_id, term_id, subject_id, trade_id, attendance_date, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (student_id, attendance_date)
         DO UPDATE SET status = EXCLUDED.status, teacher_id = EXCLUDED.teacher_id,
                      class_id = EXCLUDED.class_id, term_id = EXCLUDED.term_id,
                      subject_id = EXCLUDED.subject_id, trade_id = EXCLUDED.trade_id`,
        [student_id, teacher_id, class_id, term_id, subject_id, trade_id, attendance_date, status]
      );
      count += rowCount;
    }

    await client.query('COMMIT');
    res.status(201).json({ data: { count }, message: 'Created' });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Failed to mark attendance:', error);
    res.status(500).json({ error: 'Failed to mark attendance' });
  } finally {
    client.release();
  }
};

export const getAttendanceByClass = async (req, res) => {
  try {
    const { class_id } = req.params;
    let query = `
      SELECT att.*, s.first_name, s.last_name, s.admission_no,
             c.name as class_name, sub.name as subject_name, t.name as term_name
      FROM attendance att
      LEFT JOIN students s ON att.student_id = s.id
      LEFT JOIN classes c ON att.class_id = c.id
      LEFT JOIN subjects sub ON att.subject_id = sub.id
      LEFT JOIN terms t ON att.term_id = t.id
      WHERE att.class_id = $1
    `;
    const values = [class_id];
    let index = 2;

    if (req.query.subject_id) {
      query += ` AND att.subject_id = $${index++}`;
      values.push(req.query.subject_id);
    }
    if (req.query.term_id) {
      query += ` AND att.term_id = $${index++}`;
      values.push(req.query.term_id);
    }

    query += ` ORDER BY att.attendance_date DESC`;

    const { rows } = await pool.query(query, values);
    res.json({ data: rows });
  } catch (error) {
    logger.error('Failed to fetch attendance by class:', error);
    res.status(500).json({ error: 'Failed to fetch attendance by class' });
  }
};

export const getStudentAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    let query = `
      SELECT att.*, s.first_name, s.last_name, s.admission_no,
             c.name as class_name, sub.name as subject_name, t.name as term_name
      FROM attendance att
      LEFT JOIN students s ON att.student_id = s.id
      LEFT JOIN classes c ON att.class_id = c.id
      LEFT JOIN subjects sub ON att.subject_id = sub.id
      LEFT JOIN terms t ON att.term_id = t.id
      WHERE att.student_id = $1
    `;
    const values = [id];
    let index = 2;

    if (req.query.start_date) {
      query += ` AND att.attendance_date >= $${index++}`;
      values.push(req.query.start_date);
    }
    if (req.query.end_date) {
      query += ` AND att.attendance_date <= $${index++}`;
      values.push(req.query.end_date);
    }

    query += ` ORDER BY att.attendance_date DESC`;

    const { rows } = await pool.query(query, values);
    res.json({ data: rows });
  } catch (error) {
    logger.error('Failed to fetch student attendance:', error);
    res.status(500).json({ error: 'Failed to fetch student attendance' });
  }
};

export const getAttendanceReport = async (req, res) => {
  try {
    const { class_id, term_id } = req.params;
    const { rows } = await pool.query(
      `SELECT s.id, s.first_name, s.last_name, s.admission_no,
              COUNT(CASE WHEN att.status = 'PRESENT' THEN 1 END) as present_count,
              COUNT(CASE WHEN att.status = 'ABSENT' THEN 1 END) as absent_count,
              COUNT(CASE WHEN att.status = 'LATE' THEN 1 END) as late_count,
              COUNT(*) as total_days
       FROM attendance att
       JOIN students s ON att.student_id = s.id
       WHERE att.class_id = $1 AND att.term_id = $2
       GROUP BY s.id, s.first_name, s.last_name, s.admission_no
       ORDER BY s.last_name`,
      [class_id, term_id]
    );
    res.json({ data: rows });
  } catch (error) {
    logger.error('Failed to fetch attendance report:', error);
    res.status(500).json({ error: 'Failed to fetch attendance report' });
  }
};
