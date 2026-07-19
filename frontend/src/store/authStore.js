import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/client';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      loading: true,
      error: null,

      setUser: (user) => set({ user, loading: false }),

      login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        const { user } = response.data;
        set({ user, error: null });
        return response.data;
      },

      loginWithPin: async (admission_no, pin) => {
        const response = await api.post('/auth/students/login-pin', { admission_no, pin });
        const { user } = response.data;
        set({ user, error: null });
        return response.data;
      },

      register: async (data) => {
        const response = await api.post('/auth/register', data);
        return response.data;
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } finally {
          set({ user: null, error: null });
        }
      },

      fetchCurrentUser: async () => {
        try {
          set({ loading: true });
          const response = await api.get('/auth/me');
          set({ user: response.data.user, loading: false });
        } catch {
          set({ user: null, loading: false });
        }
      },

      updateProfile: async (data) => {
        const response = await api.put('/users/profile', data);
        set({ user: { ...get().user, ...response.data.user } });
        return response.data;
      },
    }),
    {
      name: 'srams-auth',
      partialize: (state) => ({ user: state.user }),
    }
  )
);

export default useAuthStore;
