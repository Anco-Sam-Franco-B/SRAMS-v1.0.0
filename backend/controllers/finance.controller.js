import pool from '../config/db.js';
import logger from '../config/logger.js';

export const getFeeStructures = async (req, res) => {
  try {
    const { class_id, academic_year_id } = req.query;
    let query = `
      SELECT fs.*, c.name as class_name, ay.name as year_name
      FROM fee_structures fs
      LEFT JOIN classes c ON fs.class_id = c.id
      LEFT JOIN academic_years ay ON fs.academic_year_id = ay.id
      WHERE 1=1
    `;
    const params = [];
    if (class_id) { params.push(class_id); query += ` AND fs.class_id = $${params.length}`; }
    if (academic_year_id) { params.push(academic_year_id); query += ` AND fs.academic_year_id = $${params.length}`; }
    query += ' ORDER BY c.name, fs.fee_type';
    const { rows } = await pool.query(query, params);
    res.json({ data: rows });
  } catch (error) {
    logger.error('Error fetching fee structures', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch fee structures' });
  }
};

export const createFeeStructure = async (req, res) => {
  try {
    const { class_id, academic_year_id, fee_type, amount, description } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO fee_structures (class_id, academic_year_id, fee_type, amount, description)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [class_id, academic_year_id, fee_type, amount, description]
    );
    res.status(201).json({ data: rows[0] });
  } catch (error) {
    logger.error('Error creating fee structure', { error: error.message });
    res.status(500).json({ error: 'Failed to create fee structure' });
  }
};

export const updateFeeStructure = async (req, res) => {
  try {
    const { id } = req.params;
    const { fee_type, amount, description } = req.body;
    const { rows } = await pool.query(
      `UPDATE fee_structures SET fee_type = COALESCE($1, fee_type), amount = COALESCE($2, amount),
       description = COALESCE($3, description) WHERE id = $4 RETURNING *`,
      [fee_type, amount, description, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Fee structure not found' });
    res.json({ data: rows[0] });
  } catch (error) {
    logger.error('Error updating fee structure', { error: error.message });
    res.status(500).json({ error: 'Failed to update fee structure' });
  }
};

export const deleteFeeStructure = async (req, res) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM fee_structures WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Fee structure not found' });
    res.json({ message: 'Fee structure deleted' });
  } catch (error) {
    logger.error('Error deleting fee structure', { error: error.message });
    res.status(500).json({ error: 'Failed to delete fee structure' });
  }
};

export const getPayments = async (req, res) => {
  try {
    const { student_id, date_from, date_to } = req.query;
    let query = `
      SELECT fp.*, s.first_name, s.last_name, s.admission_no, fs.fee_type, fs.amount as total_amount
      FROM fee_payments fp
      LEFT JOIN students s ON fp.student_id = s.id
      LEFT JOIN fee_structures fs ON fp.fee_structure_id = fs.id
      WHERE 1=1
    `;
    const params = [];
    if (student_id) { params.push(student_id); query += ` AND fp.student_id = $${params.length}`; }
    if (date_from) { params.push(date_from); query += ` AND fp.payment_date >= $${params.length}`; }
    if (date_to) { params.push(date_to); query += ` AND fp.payment_date <= $${params.length}`; }
    query += ' ORDER BY fp.payment_date DESC';
    const { rows } = await pool.query(query, params);
    res.json({ data: rows });
  } catch (error) {
    logger.error('Error fetching payments', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
};

export const recordPayment = async (req, res) => {
  try {
    const { student_id, fee_structure_id, amount_paid, payment_date, payment_method, receipt_number } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO fee_payments (student_id, fee_structure_id, amount_paid, payment_date, payment_method, receipt_number, recorded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [student_id, fee_structure_id, amount_paid, payment_date || new Date(), payment_method || 'cash', receipt_number, req.user.id]
    );
    res.status(201).json({ data: rows[0] });
  } catch (error) {
    logger.error('Error recording payment', { error: error.message });
    res.status(500).json({ error: 'Failed to record payment' });
  }
};

export const getStudentBalance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { academic_year_id } = req.query;
    let query = `
      SELECT fs.*, COALESCE(SUM(fp.amount_paid), 0) as total_paid,
        fs.amount - COALESCE(SUM(fp.amount_paid), 0) as balance
      FROM fee_structures fs
      LEFT JOIN fee_payments fp ON fp.fee_structure_id = fs.id AND fp.student_id = $1
      WHERE fs.class_id = (SELECT class_id FROM students WHERE id = $1)
    `;
    const params = [studentId];
    if (academic_year_id) { params.push(academic_year_id); query += ` AND fs.academic_year_id = $${params.length}`; }
    query += ' GROUP BY fs.id ORDER BY fs.fee_type';
    const { rows } = await pool.query(query, params);
    res.json({ data: rows });
  } catch (error) {
    logger.error('Error fetching student balance', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch student balance' });
  }
};

export const getFinanceSummary = async (req, res) => {
  try {
    const { academic_year_id } = req.query;
    let query = `
      SELECT
        COALESCE(SUM(fs.amount * (SELECT COUNT(*) FROM students WHERE class_id = fs.class_id)), 0) as total_expected,
        COALESCE((SELECT SUM(amount_paid) FROM fee_payments fp JOIN fee_structures fs2 ON fp.fee_structure_id = fs2.id), 0) as total_collected
      FROM fee_structures fs
    `;
    const params = [];
    if (academic_year_id) { params.push(academic_year_id); query += ` WHERE fs.academic_year_id = $${params.length}`; }
    const { rows } = await pool.query(query, params);
    const summary = rows[0];
    summary.total_pending = summary.total_expected - summary.total_collected;
    res.json({ data: summary });
  } catch (error) {
    logger.error('Error fetching finance summary', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch finance summary' });
  }
};
