import React, { useEffect, useState } from 'react';
import { BookCopy, Plus, X, Trash2, Loader2 } from 'lucide-react';
import api from '../../api/client';
import toast from 'react-hot-toast';

export default function TeacherAllocations() {
  const [allocations, setAllocations] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ teacher_id: '', trade_id: '', class_id: '', subject_id: '' });
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    try {
      const [allocRes, teacherRes, subjectRes, classRes, tradeRes] = await Promise.all([
        api.get('/teacher-subjects'),
        api.get('/teachers'),
        api.get('/subjects'),
        api.get('/classes'),
        api.get('/trades')
      ]);
      setAllocations(allocRes.data.data || []);
      setTeachers(teacherRes.data.data || []);
      setSubjects(subjectRes.data.data || []);
      setClasses(classRes.data.data || []);
      setTrades(tradeRes.data.data || []);
    } catch (e) {
      console.error('Failed to fetch data', e);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const getTeacherName = (id) => {
    const t = teachers.find(t => t.id === id);
    if (!t) return 'N/A';
    return `${t.first_name || ''} ${t.last_name || ''}`.trim();
  };
  const getSubjectName = (id) => subjects.find(s => s.id === id)?.name || 'N/A';
  const getClassLabel = (id) => {
    const c = classes.find(c => c.id === id);
    return c ? `${c.name}${c.level ? ` (${c.level})` : ''}` : 'N/A';
  };
  const getTradeName = (id) => trades.find(t => t.id === id)?.name || 'N/A';

  const handleDelete = async (alloc) => {
    if (!window.confirm('Delete this allocation?')) return;
    try {
      await api.delete(`/teacher-subjects/${alloc.teacher_id}/${alloc.subject_id}/${alloc.class_id}`);
      toast.success('Deleted');
      await fetchAll();
    } catch (e) {
      console.error('Delete failed', e);
      toast.error('Failed to delete');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/teacher-subjects', form);
      toast.success('Allocation created');
      setModalOpen(false);
      await fetchAll();
    } catch (e) {
      console.error('Create failed', e);
      toast.error('Failed to create allocation');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teacher Allocations</h1>
          <p className="text-gray-500 text-sm">Map teachers to trades, classes, and subjects.</p>
        </div>
        <button onClick={() => { setForm({ teacher_id: '', trade_id: '', class_id: '', subject_id: '' }); setModalOpen(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition text-sm font-medium">
          <Plus className="w-4 h-4" /> New Allocation
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="size-6 animate-spin text-blue-600" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                <th className="px-4 py-3">Teacher</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Trade</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {allocations.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-8 text-gray-500">No allocations found.</td></tr>
              ) : allocations.map((alloc, i) => (
                <tr key={i} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium">{alloc.teacher_first_name} {alloc.teacher_last_name}</td>
                  <td className="px-4 py-3">{alloc.subject_name}</td>
                  <td className="px-4 py-3">{alloc.class_name}</td>
                  <td className="px-4 py-3">{alloc.trade_name}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDelete(alloc)} className="text-red-500 hover:text-red-700"><Trash2 className="size-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
            <div className="flex justify-between items-center p-5 border-b">
              <h2 className="text-xl font-bold">New Allocation</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Teacher *</label>
                  <select required className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm" value={form.teacher_id} onChange={e => setForm({ ...form, teacher_id: e.target.value })}>
                    <option value="" disabled>Select Teacher</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Trade *</label>
                  <select required className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm" value={form.trade_id} onChange={e => setForm({ ...form, trade_id: e.target.value })}>
                    <option value="" disabled>Select Trade</option>
                    {trades.map(tr => <option key={tr.id} value={tr.id}>{tr.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Class *</label>
                  <select required className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm" value={form.class_id} onChange={e => setForm({ ...form, class_id: e.target.value })}>
                    <option value="" disabled>Select Class</option>
                    {classes.filter(c => !form.trade_id || c.trade_id === form.trade_id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Subject *</label>
                  <select required className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm" value={form.subject_id} onChange={e => setForm({ ...form, subject_id: e.target.value })}>
                    <option value="" disabled>Select Subject</option>
                    {subjects.filter(s => !form.trade_id || s.trade_id === form.trade_id).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm">
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
