import { create } from 'zustand';
import api from '../api/client';

const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),
  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    set({ user: data.user });
    return data.user;
  },
  loginWithPin: async (admission_no, pin) => {
    const { data } = await api.post('/students/login-pin', { admission_no, pin });
    set({ user: data.user });
    return data.user;
  },
  logout: async () => {
    try { await api.post('/auth/logout'); } catch {}
    set({ user: null });
  },
  register: async (userData) => {
    const { data } = await api.post('/auth/register', userData);
    set({ user: data.user });
    return data.user;
  },
  checkAuth: async () => {
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data.user, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },
}));

export default useAuthStore;
