import { create } from 'zustand';

const useDashboardStore = create((set) => ({
  adminStats: null,
  teacherStats: null,
  studentStats: null,
  lastFetched: null,

  setAdminStats: (stats) => set({ adminStats: stats, lastFetched: Date.now() }),
  setTeacherStats: (stats) => set({ teacherStats: stats, lastFetched: Date.now() }),
  setStudentStats: (stats) => set({ studentStats: stats, lastFetched: Date.now() }),
  clearStats: () => set({ adminStats: null, teacherStats: null, studentStats: null, lastFetched: null }),
}));

export default useDashboardStore;
