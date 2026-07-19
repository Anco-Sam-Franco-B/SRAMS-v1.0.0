import { useEffect, useState, useCallback, useMemo } from 'react';
import { Plus, X, Edit2, Filter, PenTool } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../api/client';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import StatCard from '../../components/ui/StatCard';
import EmptyState from '../../components/ui/EmptyState';
import { BarChart3, TrendingUp, Trophy, Target } from 'lucide-react';

export default function Marks() {
  const [marks, setMarks] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAssessment, setFilterAssessment] = useState('');
  const [filterStudent, setFilterStudent] = useState('');
  const [filterTrade, setFilterTrade] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState('');
  const [studentMarks, setStudentMarks] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editMarkId, setEditMarkId] = useState(null);
  const [editMarksValue, setEditMarksValue] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  const fetchMarks = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterAssessment) params.assessment_id = filterAssessment;
      if (filterStudent) params.student_id = filterStudent;
      if (filterTrade) params.trade_id = filterTrade;
      const res = await api.get('/marks', { params });
      setMarks(res.data.data || []);
    } catch { toast.error('Failed to load marks'); }
    finally { setLoading(false); }
  }, [filterAssessment, filterStudent, filterTrade]);

  const fetchLookups = async () => {
    try {
      const [a, s, t] = await Promise.all([api.get('/assessments'), api.get('/students'), api.get('/trades')]);
      setAssessments(a.data.data || []);
      setAllStudents(s.data.data || []);
      setTrades(t.data.data || []);
    } catch { toast.error('Failed to load lookup data'); }
  };

  useEffect(() => { fetchLookups(); }, []);
  useEffect(() => { fetchMarks(); }, [fetchMarks]);

  const stats = useMemo(() => {
    const grouped = {};
    marks.forEach(m => {
      const aid = m.assessment_id;
      if (!grouped[aid]) grouped[aid] = { total: 0, sum: 0, highest: -1, lowest: Infinity };
      grouped[aid].total += 1;
      grouped[aid].sum += Number(m.marks) || 0;
      grouped[aid].highest = Math.max(grouped[aid].highest, Number(m.marks) || 0);
      grouped[aid].lowest = Math.min(grouped[aid].lowest, Number(m.marks) || 0);
    });
    Object.keys(grouped).forEach(k => {
      grouped[k].average = grouped[k].total > 0 ? (grouped[k].sum / grouped[k].total).toFixed(1) : '0';
      if (grouped[k].lowest === Infinity) grouped[k].lowest = 0;
    });
    return grouped;
  }, [marks]);

  const selectedAssessmentData = assessments.find(a => a.id === selectedAssessment);
  const filteredStudentsForEntry = selectedAssessmentData ? allStudents.filter(s => s.trade_id === selectedAssessmentData.trade_id && s.is_active !== false) : [];

  const handleStudentMarkChange = (studentId, value) => setStudentMarks(prev => ({ ...prev, [studentId]: value }));

  const handleSaveMarks = async () => {
    if (!selectedAssessment) return toast.error('Please select an assessment');
    const assessment = assessments.find(a => a.id === selectedAssessment);
    if (!assessment) return;
    const entries = filteredStudentsForEntry.filter(s => studentMarks[s.id] !== undefined && studentMarks[s.id] !== '').map(s => ({
      student_id: s.id, assessment_id: selectedAssessment, marks: Number(studentMarks[s.id]),
      trade_id: assessment.trade_id || null, teacher_id: assessment.teacher_id || null,
    }));
    if (entries.length === 0) return toast.error('Please enter marks for at least one student');
    const invalid = entries.find(e => e.marks < 0 || e.marks > assessment.total_marks);
    if (invalid) return toast.error(`Marks must be between 0 and ${assessment.total_marks}`);
    setSubmitting(true);
    try {
      await api.post('/marks/enter', { marks: entries });
      toast.success(`Marks saved for ${entries.length} student(s)`);
      setShowModal(false); setSelectedAssessment(''); setStudentMarks({}); fetchMarks();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to save marks'); }
    finally { setSubmitting(false); }
  };

  const handleUpdateMark = async () => {
    if (editMarksValue === '' || isNaN(Number(editMarksValue))) return toast.error('Please enter a valid mark');
    setEditSubmitting(true);
    try {
      const mark = marks.find(m => m.id === editMarkId);
      if (!mark) return;
      await api.post('/marks/enter', { marks: [{ student_id: mark.student_id, assessment_id: mark.assessment_id, marks: Number(editMarksValue), trade_id: mark.trade_id || null, teacher_id: mark.teacher_id || null }] });
      toast.success('Mark updated');
      setShowEditModal(false); setEditMarkId(null); setEditMarksValue(''); fetchMarks();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to update mark'); }
    finally { setEditSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Marks Management" subtitle="Enter, view, and manage student assessment scores" action onAction={() => { setShowModal(true); setSelectedAssessment(''); setStudentMarks({}); }} actionLabel="Enter Marks" actionIcon={Plus} />

      {/* Filters */}
      <div className="bg-white dark:bg-surface-900 rounded-2xl shadow-card border border-surface-100 dark:border-surface-800 p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-surface-500"><Filter className="w-4 h-4" /><span className="font-medium">Filters</span></div>
          <select value={filterAssessment} onChange={(e) => setFilterAssessment(e.target.value)} className="select-field w-auto min-w-[160px]"><option value="">All Assessments</option>{assessments.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}</select>
          <select value={filterStudent} onChange={(e) => setFilterStudent(e.target.value)} className="select-field w-auto min-w-[160px]"><option value="">All Students</option>{allStudents.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}</select>
          <select value={filterTrade} onChange={(e) => setFilterTrade(e.target.value)} className="select-field w-auto min-w-[160px]"><option value="">All Trades</option>{trades.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
          {(filterAssessment || filterStudent || filterTrade) && (
            <button onClick={() => { setFilterAssessment(''); setFilterStudent(''); setFilterTrade(''); }} className="text-sm text-surface-500 hover:text-surface-700 flex items-center gap-1"><X className="w-3.5 h-3.5" /> Clear</button>
          )}
        </div>
      </div>

      {/* Statistics */}
      {filterAssessment && stats[filterAssessment] && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={BarChart3} label="Total Entries" value={stats[filterAssessment].total} color="primary" />
          <StatCard icon={TrendingUp} label="Class Average" value={stats[filterAssessment].average} color="info" />
          <StatCard icon={Trophy} label="Highest" value={stats[filterAssessment].highest} color="emerald" />
          <StatCard icon={Target} label="Lowest" value={stats[filterAssessment].lowest} color="red" />
        </motion.div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-surface-900 rounded-2xl shadow-card border border-surface-100 dark:border-surface-800 overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center"><div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : marks.length === 0 ? (
          <EmptyState icon={PenTool} title="No Marks Recorded" description="Enter marks for assessments to see them here." action="Enter Marks" onAction={() => setShowModal(true)} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-100 dark:border-surface-800">
                  {['Student', 'Adm No', 'Assessment', 'Marks', 'Total', 'Percentage', ''].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {marks.map(m => {
                  const pct = m.total_marks > 0 ? ((m.marks / m.total_marks) * 100).toFixed(1) : '0.0';
                  const pctNum = parseFloat(pct);
                  return (
                    <tr key={m.id} className="border-b border-surface-50 dark:border-surface-800/50 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                      <td className="px-6 py-3 text-sm font-medium text-surface-900 dark:text-surface-100">{m.first_name} {m.last_name}</td>
                      <td className="px-6 py-3 text-sm text-surface-500 font-mono">{m.admission_no}</td>
                      <td className="px-6 py-3 text-sm">{m.assessment_title || 'N/A'}</td>
                      <td className="px-6 py-3 text-sm font-bold text-primary-600">{m.marks}</td>
                      <td className="px-6 py-3 text-sm text-surface-500">{m.total_marks}</td>
                      <td className="px-6 py-3"><Badge variant={pctNum >= 75 ? 'success' : pctNum >= 50 ? 'warning' : 'danger'}>{pct}%</Badge></td>
                      <td className="px-6 py-3 text-right">
                        <button onClick={() => { setEditMarkId(m.id); setEditMarksValue(m.marks?.toString() || ''); setShowEditModal(true); }}
                          className="p-1.5 rounded-lg text-surface-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"><Edit2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Enter Marks Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setSelectedAssessment(''); setStudentMarks({}); }} title="Enter Marks" maxWidth="max-w-3xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Assessment *</label>
              <select value={selectedAssessment} onChange={(e) => { setSelectedAssessment(e.target.value); setStudentMarks({}); }} className="select-field">
                <option value="">Select Assessment</option>
                {assessments.map(a => <option key={a.id} value={a.id}>{a.title} ({a.total_marks} marks)</option>)}
              </select>
            </div>
            {selectedAssessmentData && (
              <div className="flex items-end"><div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl px-4 py-2.5 w-full"><p className="text-xs text-primary-600 font-medium">Total Marks</p><p className="text-lg font-bold text-primary-700 dark:text-primary-400">{selectedAssessmentData.total_marks}</p></div></div>
            )}
          </div>
          {selectedAssessment && filteredStudentsForEntry.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300">Students ({filteredStudentsForEntry.length})</h3>
                <button onClick={() => { const m = {}; filteredStudentsForEntry.forEach(s => { m[s.id] = '0'; }); setStudentMarks(m); }}
                  className="text-xs px-3 py-1.5 bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors font-medium">Set All to 0</button>
              </div>
              <div className="border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-surface-50 dark:bg-surface-800"><tr><th className="text-left px-4 py-2.5 text-surface-500 dark:text-surface-400">Student</th><th className="text-left px-4 py-2.5 text-surface-500 dark:text-surface-400">Adm No</th><th className="text-right px-4 py-2.5 w-32 text-surface-500 dark:text-surface-400">Marks (0-{selectedAssessmentData?.total_marks})</th></tr></thead>
                  <tbody>{filteredStudentsForEntry.map(s => (
                    <tr key={s.id} className="border-t border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50">
                      <td className="px-4 py-2.5 font-medium text-surface-900 dark:text-surface-100">{s.first_name} {s.last_name}</td>
                      <td className="px-4 py-2.5 text-surface-500 font-mono">{s.admission_no}</td>
                      <td className="px-4 py-2.5 text-right"><input type="number" min="0" max={selectedAssessmentData?.total_marks || 100} value={studentMarks[s.id] || ''} onChange={(e) => handleStudentMarkChange(s.id, e.target.value)} className="w-24 text-right bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" placeholder="0" /></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => { setShowModal(false); setSelectedAssessment(''); setStudentMarks({}); }}>Cancel</Button>
            <Button onClick={handleSaveMarks} loading={submitting}>Save Marks</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Mark Modal */}
      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setEditMarkId(null); setEditMarksValue(''); }} title="Edit Mark" maxWidth="max-w-sm">
        <div className="space-y-4">
          <div><label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Marks Scored</label><input type="number" min="0" value={editMarksValue} onChange={(e) => setEditMarksValue(e.target.value)} className="input-field" autoFocus /></div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => { setShowEditModal(false); setEditMarkId(null); setEditMarksValue(''); }}>Cancel</Button>
            <Button onClick={handleUpdateMark} loading={editSubmitting}>Update</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
