import pool from '../config/db.js';
import { emitToUser, emitToRole } from '../config/socket.js';
import logger from '../config/logger.js';

export async function createNotification({ userId, title, message, type = 'info', link = null }) {
  try {
    const { rows } = await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, link, is_read, created_at)
       VALUES ($1, $2, $3, $4, $5, false, CURRENT_TIMESTAMP) RETURNING *`,
      [userId, title, message, type, link]
    );

    const notification = rows[0];
    emitToUser(userId, 'notification:new', notification);

    return notification;
  } catch (error) {
    logger.error('Failed to create notification:', error.message);
    return null;
  }
}

export async function createBulkNotifications({ userIds, title, message, type = 'info', link = null }) {
  try {
    const values = userIds.map(id => `('${id}', '${title.replace(/'/g, "''")}', '${message.replace(/'/g, "''")}', '${type}', ${link ? `'${link}'` : 'NULL'}, false, CURRENT_TIMESTAMP)`).join(',');
    const { rows } = await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, link, is_read, created_at)
       VALUES ${values} RETURNING *`
    );

    rows.forEach(n => emitToUser(n.user_id, 'notification:new', n));

    return rows;
  } catch (error) {
    logger.error('Failed to create bulk notifications:', error.message);
    return [];
  }
}

export async function notifyRole(role, title, message, type = 'info', link = null) {
  try {
    const { rows: users } = await pool.query(
      `SELECT u.id FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = $1 AND u.is_active = true`,
      [role]
    );

    if (users.length > 0) {
      return createBulkNotifications({
        userIds: users.map(u => u.id),
        title,
        message,
        type,
        link,
      });
    }
  } catch (error) {
    logger.error('Failed to notify role:', error.message);
  }
}
