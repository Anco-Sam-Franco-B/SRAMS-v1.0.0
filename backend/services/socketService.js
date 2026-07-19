import { getIO } from '../config/socket.js';
import pool from '../config/db.js';
import logger from '../config/logger.js';

export async function notifyUser(userId, { title, message, type = 'info', link }) {
  try {
    const { rows } = await pool.query(
      `INSERT INTO notifications (user_id, title, message, is_read)
       VALUES ($1, $2, $3, false) RETURNING id`,
      [userId, title, message]
    );
    const notification = rows[0];
    try {
      const io = getIO();
      io.to(`user:${userId}`).emit('notification:new', { ...notification, type, link });
    } catch {}
    return notification;
  } catch (error) {
    logger.error('Failed to create notification', { error: error.message });
  }
}

export async function notifyRole(role, { title, message, type = 'info' }) {
  try {
    const { rows: users } = await pool.query(
      `SELECT id FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = $1 AND u.is_active = true`,
      [role]
    );
    for (const user of users) {
      await notifyUser(user.id, { title, message, type });
    }
  } catch (error) {
    logger.error('Failed to notify role', { error: error.message, role });
  }
}

export async function broadcastAnnouncement(announcement, audiences) {
  try {
    const io = getIO();
    io.to('role:Administrator').emit('announcement:new', announcement);
    if (audiences.includes('all') || audiences.includes('teachers')) {
      io.to('role:Teacher').emit('announcement:new', announcement);
    }
    if (audiences.includes('all') || audiences.includes('students')) {
      io.to('role:Student').emit('announcement:new', announcement);
    }
    if (audiences.includes('all') || audiences.includes('parents')) {
      io.to('role:Parent').emit('announcement:new', announcement);
    }
  } catch (error) {
    logger.error('Failed to broadcast announcement', { error: error.message });
  }
}

export function broadcastToRoom(room, event, data) {
  try {
    const io = getIO();
    io.to(room).emit(event, data);
  } catch (error) {
    logger.error('Failed to broadcast', { error: error.message });
  }
}
