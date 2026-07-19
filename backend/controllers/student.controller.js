import pool from '../config/db.js';
import logger from '../config/logger.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { generateAdmissionNumber } from '../utils/admissionNumber.js';

const SALT_ROUNDS = 12;
const DEFAULT_PIN = '1234';
const PIN_ATTEMPT_LIMIT = 5;
const PIN_LOCK_MINUTES = 15;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// GET /api/students
export const getAll = async (req, res) => {
  try {
    const { trade_id, class_id, search } = req.query;
    let query = `
      SELECT s.*, t.name AS trade_name, c.name AS class_name
      FROM students s
      LEFT JOIN trade t ON s.trade_id = t.id
      LEFT JOIN classes c ON s.class_id = c.id
    `;
    const conditions = [];
    const values = [];
    let idx = 1;

    if (trade_id && trade_id !== 'undefined') {
      conditions.push(`s.trade_id = $${idx++}`);
      values.push(trade_id);
    }
    if (class_id && class_id !== 'undefined') {
      conditions.push(`s.class_id = $${idx++}`);
      values.push(class_id);
    }
    if (search && search !== 'undefined') {
      conditions.push(`(s.first_name ILIKE $${idx} OR s.last_name ILIKE $${idx} OR s.admission_no ILIKE $${idx})`);
      values.push(`%${search}%`);
      idx++;
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    query += ` ORDER BY s.last_name, s.first_name`;

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    logger.error('Failed to fetch students', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
};

// GET /api/students/:id
export const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `
      SELECT s.*, t.name AS trade_name, c.name AS class_name
      FROM students s
      LEFT JOIN trade t ON s.trade_id = t.id
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE s.id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Failed to fetch student', error);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
};

// POST /api/students
export const create = async (req, res) => {
  const client = await pool.connect();
  try {
    const { trade_id, class_id, first_name, last_name, email, gender, nationality, phone, date_of_birth } = req.body;

    const admissionNo = await generateAdmissionNumber();
    const pinHash = await bcrypt.hash(DEFAULT_PIN, SALT_ROUNDS);

    await client.query('BEGIN');

    const result = await client.query(
      `
      INSERT INTO students (admission_no, trade_id, class_id, first_name, last_name, email, gender, nationality, phone, date_of_birth, pin_hash)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
      `,
      [admissionNo, trade_id || null, class_id || null, first_name, last_name, email || null, gender || null, nationality || null, phone || null, date_of_birth || null, pinHash]
    );

    await client.query('COMMIT');

    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Failed to create student', error);
    res.status(500).json({ error: 'Failed to create student' });
  } finally {
    client.release();
  }
};

// PUT /api/students/:id
export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, email, gender, nationality, phone, date_of_birth, trade_id, class_id } = req.body;

    const result = await pool.query(
      `
      UPDATE students
      SET first_name = $1, last_name = $2, email = $3, gender = $4, nationality = $5,
          phone = $6, date_of_birth = $7, trade_id = $8, class_id = $9
      WHERE id = $10
      RETURNING *
      `,
      [first_name, last_name, email, gender, nationality, phone, date_of_birth, trade_id || null, class_id || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Failed to update student', error);
    res.status(500).json({ error: 'Failed to update student' });
  }
};

// DELETE /api/students/:id
export const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM students WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete student', error);
    res.status(500).json({ error: 'Failed to delete student' });
  }
};

// PUT /api/students/:id/change-pin
export const changePin = async (req, res) => {
  try {
    const { id } = req.params;
    const { current_pin, new_pin } = req.body;

    const result = await pool.query('SELECT * FROM students WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const student = result.rows[0];
    const valid = await bcrypt.compare(current_pin, student.pin_hash);
    if (!valid) {
      return res.status(400).json({ error: 'Current PIN is incorrect' });
    }

    const newHash = await bcrypt.hash(new_pin, SALT_ROUNDS);
    await pool.query(
      'UPDATE students SET pin_hash = $1, pin_changed_at = NOW() WHERE id = $2',
      [newHash, id]
    );

    res.json({ message: 'PIN changed successfully' });
  } catch (error) {
    logger.error('Failed to change PIN', error);
    res.status(500).json({ error: 'Failed to change PIN' });
  }
};

// POST /api/students/login-pin
export const loginWithPin = async (req, res) => {
  try {
    const { admission_no, pin } = req.body;

    const result = await pool.query(
      'SELECT * FROM students WHERE admission_no = $1 AND is_active = true',
      [admission_no]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid admission number or inactive account' });
    }

    const student = result.rows[0];

    // Check lock
    if (student.pin_locked_until && new Date(student.pin_locked_until) > new Date()) {
      return res.status(423).json({ error: 'Account is locked. Try again later.' });
    }

    const valid = await bcrypt.compare(pin, student.pin_hash);

    if (!valid) {
      const attempts = (student.pin_attempts || 0) + 1;
      let lockUntil = null;
      if (attempts >= PIN_ATTEMPT_LIMIT) {
        lockUntil = new Date(Date.now() + PIN_LOCK_MINUTES * 60 * 1000);
      }
      await pool.query(
        'UPDATE students SET pin_attempts = $1, pin_locked_until = $2 WHERE id = $3',
        [attempts, lockUntil, student.id]
      );
      return res.status(401).json({ error: 'Invalid PIN' });
    }

    // Reset attempts on success
    await pool.query(
      'UPDATE students SET pin_attempts = 0, pin_locked_until = NULL WHERE id = $1',
      [student.id]
    );

    // Find or create linked user account
    let userId = student.user_id;
    if (!userId) {
      // Check if a user with this email already exists
      const emailToUse = student.email || `student-${student.admission_no}@srams.local`;
      const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [emailToUse]);
      
      if (existingUser.rows.length > 0) {
        userId = existingUser.rows[0].id;
      } else {
        const roleResult = await pool.query(`SELECT id FROM roles WHERE name = 'Student'`);
        const studentRoleId = roleResult.rows[0]?.id;
        
        const userResult = await pool.query(
          `INSERT INTO users (email, password_hash, role_id, first_name, last_name)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [emailToUse, await bcrypt.hash(pin, SALT_ROUNDS), studentRoleId, student.first_name, student.last_name]
        );
        userId = userResult.rows[0].id;
      }
      await pool.query('UPDATE students SET user_id = $1 WHERE id = $2', [userId, student.id]);
    }

    // Generate JWT
    const token = jwt.sign({ id: userId, role: 'Student', studentId: student.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.cookie('accessToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ user: { id: userId, role: 'Student', studentId: student.id, first_name: student.first_name, last_name: student.last_name } });
  } catch (error) {
    logger.error('Failed to login with PIN', error);
    res.status(500).json({ error: 'Failed to login' });
  }
};

// GET /api/students/dashboard
export const getStudentDashboard = async (req, res) => {
  try {
    const studentId = req.user.studentId || req.user.id;

    const studentResult = await pool.query(
      `
      SELECT s.*, t.name AS trade_name, c.name AS class_name
      FROM students s
      LEFT JOIN trade t ON s.trade_id = t.id
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE s.id = $1 OR s.user_id = $2
      `,
      [studentId, req.user.id]
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const student = studentResult.rows[0];

    // Average marks
    const avgResult = await pool.query(
      'SELECT COALESCE(AVG(mark), 0) AS average FROM marks WHERE student_id = $1',
      [student.id]
    );

    // Attendance percentage
    const attResult = await pool.query(
      `SELECT
        CASE WHEN COUNT(*) = 0 THEN 0
        ELSE ROUND(COUNT(*) FILTER (WHERE status = 'present')::numeric / COUNT(*) * 100, 1)
        END AS attendance_pct
       FROM attendance WHERE student_id = $1`,
      [student.id]
    );

    // Position from report_cards
    const posResult = await pool.query(
      'SELECT position FROM report_cards WHERE student_id = $1 ORDER BY created_at DESC LIMIT 1',
      [student.id]
    );

    res.json({
      student,
      stats: {
        average: parseFloat(avgResult.rows[0]?.average || 0),
        attendance_pct: parseFloat(attResult.rows[0]?.attendance_pct || 0),
        position: posResult.rows[0]?.position || null
      }
    });
  } catch (error) {
    logger.error('Failed to fetch student dashboard', error);
    res.status(500).json({ error: 'Failed to fetch student dashboard' });
  }
};
