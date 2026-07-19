import pool from '../config/db.js';
import logger from '../config/logger.js';

export const getBooks = async (req, res) => {
  try {
    const { search, category } = req.query;
    let query = 'SELECT * FROM library_books WHERE 1=1';
    const params = [];
    if (search) { params.push(`%${search}%`); query += ` AND (title ILIKE $${params.length} OR author ILIKE $${params.length} OR isbn ILIKE $${params.length})`; }
    if (category) { params.push(category); query += ` AND category = $${params.length}`; }
    query += ' ORDER BY title';
    const { rows } = await pool.query(query, params);
    res.json({ data: rows });
  } catch (error) {
    logger.error('Error fetching books', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch books' });
  }
};

export const createBook = async (req, res) => {
  try {
    const { title, author, isbn, category, total_copies } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO library_books (title, author, isbn, category, total_copies, available_copies)
       VALUES ($1, $2, $3, $4, $5, $5) RETURNING *`,
      [title, author, isbn, category, total_copies || 1]
    );
    res.status(201).json({ data: rows[0] });
  } catch (error) {
    logger.error('Error creating book', { error: error.message });
    res.status(500).json({ error: 'Failed to create book' });
  }
};

export const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, author, isbn, category, total_copies } = req.body;
    const { rows } = await pool.query(
      `UPDATE library_books SET title = COALESCE($1, title), author = COALESCE($2, author),
       isbn = COALESCE($3, isbn), category = COALESCE($4, category),
       total_copies = COALESCE($5, total_copies) WHERE id = $6 RETURNING *`,
      [title, author, isbn, category, total_copies, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Book not found' });
    res.json({ data: rows[0] });
  } catch (error) {
    logger.error('Error updating book', { error: error.message });
    res.status(500).json({ error: 'Failed to update book' });
  }
};

export const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM library_books WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Book not found' });
    res.json({ message: 'Book deleted' });
  } catch (error) {
    logger.error('Error deleting book', { error: error.message });
    res.status(500).json({ error: 'Failed to delete book' });
  }
};

export const borrowBook = async (req, res) => {
  try {
    const { book_id, student_id, due_date } = req.body;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const book = await client.query('SELECT available_copies FROM library_books WHERE id = $1', [book_id]);
      if (book.rows.length === 0 || book.rows[0].available_copies <= 0) {
        throw new Error('Book not available');
      }
      await client.query('UPDATE library_books SET available_copies = available_copies - 1 WHERE id = $1', [book_id]);
      const { rows } = await client.query(
        `INSERT INTO library_transactions (book_id, student_id, borrow_date, due_date, status)
         VALUES ($1, $2, CURRENT_DATE, $3, 'borrowed') RETURNING *`,
        [book_id, student_id, due_date || new Date(Date.now() + 14 * 86400000)]
      );
      await client.query('COMMIT');
      res.status(201).json({ data: rows[0] });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Error borrowing book', { error: error.message });
    res.status(400).json({ error: error.message || 'Failed to borrow book' });
  }
};

export const returnBook = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const txn = await client.query('SELECT book_id FROM library_transactions WHERE id = $1 AND return_date IS NULL', [id]);
      if (txn.rows.length === 0) throw new Error('Transaction not found or already returned');
      await client.query('UPDATE library_books SET available_copies = available_copies + 1 WHERE id = $1', [txn.rows[0].book_id]);
      const { rows } = await client.query(
        `UPDATE library_transactions SET return_date = CURRENT_DATE, status = 'returned' WHERE id = $1 RETURNING *`, [id]
      );
      await client.query('COMMIT');
      res.json({ data: rows[0] });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Error returning book', { error: error.message });
    res.status(400).json({ error: error.message || 'Failed to return book' });
  }
};

export const getTransactions = async (req, res) => {
  try {
    const { student_id, status } = req.query;
    let query = `
      SELECT lt.*, lb.title as book_title, lb.author as book_author,
        s.first_name, s.last_name, s.admission_no
      FROM library_transactions lt
      JOIN library_books lb ON lt.book_id = lb.id
      LEFT JOIN students s ON lt.student_id = s.id
      WHERE 1=1
    `;
    const params = [];
    if (student_id) { params.push(student_id); query += ` AND lt.student_id = $${params.length}`; }
    if (status) { params.push(status); query += ` AND lt.status = $${params.length}`; }
    query += ' ORDER BY lt.created_at DESC';
    const { rows } = await pool.query(query, params);
    res.json({ data: rows });
  } catch (error) {
    logger.error('Error fetching transactions', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

export const getOverdueBooks = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT lt.*, lb.title as book_title, s.first_name, s.last_name, s.admission_no
      FROM library_transactions lt
      JOIN library_books lb ON lt.book_id = lb.id
      LEFT JOIN students s ON lt.student_id = s.id
      WHERE lt.return_date IS NULL AND lt.due_date < CURRENT_DATE
      ORDER BY lt.due_date
    `);
    res.json({ data: rows });
  } catch (error) {
    logger.error('Error fetching overdue books', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch overdue books' });
  }
};
