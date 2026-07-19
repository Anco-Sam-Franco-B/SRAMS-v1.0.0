import { create } from 'zustand';
import api from '../api/client';

const useCascadeStore = create((set, get) => ({
  trades: [],
  academicYears: [],
  terms: [],
  classes: [],
  subjects: [],
  students: [],
  selectedTrade: '',
  selectedYear: '',
  selectedTerm: '',
  selectedClass: '',
  selectedSubject: '',
  loading: { trades: false, years: false, terms: false, classes: false, subjects: false, students: false },

  fetchTrades: async () => {
    set((s) => ({ loading: { ...s.loading, trades: true } }));
    try {
      const { data } = await api.get('/trades');
      set({ trades: data.data, loading: (s) => ({ ...s, trades: false }) });
    } catch { set((s) => ({ loading: { ...s, trades: false } })); }
  },

  fetchAcademicYears: async () => {
    set((s) => ({ loading: { ...s.loading, years: true } }));
    try {
      const { data } = await api.get('/academic-years');
      set({ academicYears: data.data, loading: (s) => ({ ...s, years: false }) });
    } catch { set((s) => ({ loading: { ...s, years: false } })); }
  },

  fetchTerms: async (yearId) => {
    if (!yearId) { set({ terms: [] }); return; }
    try {
      const { data } = await api.get(`/terms?academic_year_id=${yearId}`);
      set({ terms: data.data });
    } catch { set({ terms: [] }); }
  },

  fetchClasses: async (tradeId) => {
    if (!tradeId) { set({ classes: [] }); return; }
    try {
      const { data } = await api.get(`/classes?trade_id=${tradeId}`);
      set({ classes: data.data });
    } catch { set({ classes: [] }); }
  },

  fetchSubjects: async (tradeId, classId) => {
    if (!classId) { set({ subjects: [] }); return; }
    try {
      const params = new URLSearchParams({ trade_id: tradeId, class_id: classId });
      const { data } = await api.get(`/subjects?${params}`);
      set({ subjects: data.data });
    } catch { set({ subjects: [] }); }
  },

  fetchStudents: async (tradeId, classId) => {
    if (!classId) { set({ students: [] }); return; }
    try {
      const { data } = await api.get(`/students?class_id=${classId}&trade_id=${tradeId}`);
      set({ students: data.data });
    } catch { set({ students: [] }); }
  },

  setSelectedTrade: (v) => set({ selectedTrade: v, selectedClass: '', selectedSubject: '', classes: [], subjects: [], students: [] }),
  setSelectedYear: (v) => set({ selectedYear: v, selectedTerm: '', terms: [] }),
  setSelectedTerm: (v) => set({ selectedTerm: v }),
  setSelectedClass: (v) => set({ selectedClass: v, selectedSubject: '', subjects: [], students: [] }),
  setSelectedSubject: (v) => set({ selectedSubject: v }),

  reset: () => set({
    selectedTrade: '', selectedYear: '', selectedTerm: '', selectedClass: '', selectedSubject: '',
    classes: [], subjects: [], students: [], terms: [],
  }),
}));

export default useCascadeStore;
