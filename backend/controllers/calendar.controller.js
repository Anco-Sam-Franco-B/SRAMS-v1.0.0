import pool from '../config/db.js';
import logger from '../config/logger.js';

export const getAll = async (req, res) => {
  try {
    const { month, year, event_type } = req.query;
    let query = 'SELECT * FROM calendar_events WHERE 1=1';
    const params = [];
    if (month && year) {
      params.push(`${year}-${String(month).padStart(2, '0')}-01`);
      query += ` AND start_date >= $${params.length}`;
      params.push(`${year}-${String(month).padStart(2, '0')}-31`);
      query += ` AND start_date <= $${params.length}`;
    }
    if (event_type) { params.push(event_type); query += ` AND event_type = $${params.length}`; }
    query += ' ORDER BY start_date ASC';
    const { rows } = await pool.query(query, params);
    res.json({ data: rows });
  } catch (error) {
    logger.error('Error fetching calendar events', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};

export const create = async (req, res) => {
  try {
    const { title, description, event_type, start_date, end_date, is_recurring, recurrence_rule } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO calendar_events (title, description, event_type, start_date, end_date, is_recurring, recurrence_rule, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [title, description, event_type || 'event', start_date, end_date, is_recurring || false, recurrence_rule, req.user.id]
    );
    res.status(201).json({ data: rows[0] });
  } catch (error) {
    logger.error('Error creating calendar event', { error: error.message });
    res.status(500).json({ error: 'Failed to create event' });
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, event_type, start_date, end_date } = req.body;
    const { rows } = await pool.query(
      `UPDATE calendar_events SET title = COALESCE($1, title), description = COALESCE($2, description),
       event_type = COALESCE($3, event_type), start_date = COALESCE($4, start_date),
       end_date = COALESCE($5, end_date) WHERE id = $6 RETURNING *`,
      [title, description, event_type, start_date, end_date, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Event not found' });
    res.json({ data: rows[0] });
  } catch (error) {
    logger.error('Error updating calendar event', { error: error.message });
    res.status(500).json({ error: 'Failed to update event' });
  }
};

export const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM calendar_events WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Event not found' });
    res.json({ message: 'Event deleted' });
  } catch (error) {
    logger.error('Error deleting calendar event', { error: error.message });
    res.status(500).json({ error: 'Failed to delete event' });
  }
};
