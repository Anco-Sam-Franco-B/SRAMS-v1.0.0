import { create } from 'zustand';
import api from '../api/client';

const useAcademicStore = create((set) => ({
  currentYear: null,
  currentTerm: null,
  loading: false,
  fetchCurrent: async () => {
    set({ loading: true });
    try {
      const [yearsRes, termsRes] = await Promise.all([
        api.get('/academic-years'),
        api.get('/terms'),
      ]);
      const currentYear = yearsRes.data.data.find((y) => y.is_current) || null;
      const currentTerm = termsRes.data.data.find((t) => t.is_current) || null;
      set({ currentYear, currentTerm, loading: false });
    } catch {
      set({ loading: false });
    }
  },
}));

export default useAcademicStore;
