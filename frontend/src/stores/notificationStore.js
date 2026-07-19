import { create } from 'zustand';
import api from '../api/client';

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  fetchNotifications: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get('/notifications');
      set({ notifications: data.data, loading: false });
    } catch {
      set({ loading: false });
    }
  },
  fetchUnreadCount: async () => {
    try {
      const { data } = await api.get('/messages/unread-count');
      set({ unreadCount: data.data.count });
    } catch {}
  },
  addNotification: (notification) => set((s) => ({
    notifications: [notification, ...s.notifications],
    unreadCount: s.unreadCount + 1,
  })),
  markAsRead: async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      set((s) => ({
        notifications: s.notifications.map((n) => n.id === id ? { ...n, is_read: true } : n),
        unreadCount: Math.max(0, s.unreadCount - 1),
      }));
    } catch {}
  },
  markAllRead: async () => {
    try {
      await api.put('/notifications/read-all');
      set((s) => ({
        notifications: s.notifications.map((n) => ({ ...n, is_read: true })),
        unreadCount: 0,
      }));
    } catch {}
  },
}));

export default useNotificationStore;
