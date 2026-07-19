import { useEffect, useState, useCallback, useMemo } from 'react';
import { useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel, getPaginationRowModel, flexRender } from '@tanstack/react-table';
import { Plus, Search, X, Edit2, Trash2, Filter, ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, ClipboardList } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../api/client';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';

export default function Assessments() {
  const [assessments, setAssessments] = useState([]);
  const [trades, setTrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sorting, setSorting] = useState([]);
  const [filterTrade, setFilterTrade] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterTerm, setFilterTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ trade_id: '', subject_id: '', term_id: '', title: '', total_marks: '' });
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const fetchAssessments = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterTrade) params.trade_id = filterTrade;
      if (filterSubject) params.subject_id = filterSubject;
      if (filterTerm) params.term_id = filterTerm;
      const res = await api.get('/assessments', { params });
      setAssessments(res.data.data || []);
    } catch { toast.error('Failed to load assessments'); }
    finally { setLoading(false); }
  }, [filterTrade, filterSubject, filterTerm]);

  const fetchLookups = async () => {
    try {
      const [t, s, te] = await Promise.all([api.get('/trades'), api.get('/subjects'), api.get('/terms')]);
      setTrades(t.data.data || []);
      setSubjects(s.data.data || []);
      setTerms(te.data.data || []);
    } catch { toast.error('Failed to load lookup data'); }
  };

  useEffect(() => { fetchLookups(); }, []);
  useEffect(() => { fetchAssessments(); }, [fetchAssessments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.trade_id || !formData.subject_id || !formData.term_id || !formData.title || !formData.total_marks) {
      return toast.error('Please fill all required fields');
    }
    setSubmitting(true);
    try {
      const payload = { ...formData, total_marks: Number(formData.total_marks) };
      if (isEdit) {
        await api.put(`/assessments/${editingId}`, payload);
        toast.success('Assessment updated');
      } else {
        await api.post('/assessments', payload);
        toast.success('Assessment created');
      }
      setShowModal(false); setIsEdit(false); setEditingId(null);
      setFormData({ trade_id: '', subject_id: '', term_id: '', title: '', total_marks: '' });
      fetchAssessments();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to save'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/assessments/${id}`);
      toast.success('Assessment deleted');
      setDeleteConfirm(false); setDeleteId(null); fetchAssessments();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to delete'); }
  };

  const columns = useMemo(() => [
    { accessorKey: 'title', header: 'Title', cell: ({ row }) => <span className="font-medium text-surface-900 dark:text-surface-100">{row.original.title || 'Untitled'}</span> },
    { accessorKey: 'subject_name', header: 'Subject', cell: ({ row }) => row.original.subject_name || 'N/A' },
    { accessorKey: 'trade_name', header: 'Trade', cell: ({ row }) => row.original.trade_name || 'N/A' },
    { accessorKey: 'term_name', header: 'Term', cell: ({ row }) => row.original.term_name || 'N/A' },
    { accessorKey: 'total_marks', header: 'Marks', cell: ({ row }) => <Badge variant="info">{row.original.total_marks}</Badge> },
    { id: 'actions', header: '', cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <button onClick={() => { setIsEdit(true); setEditingId(row.original.id); setFormData({ trade_id: row.original.trade_id || '', subject_id: row.original.subject_id || '', term_id: row.original.term_id || '', title: row.original.title || '', total_marks: row.original.total_marks || '' }); setShowModal(true); }}
          className="p-1.5 rounded-lg text-surface-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"><Edit2 className="w-4 h-4" /></button>
        <button onClick={() => { setDeleteId(row.original.id); setDeleteConfirm(true); }}
          className="p-1.5 rounded-lg text-surface-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 className="w-4 h-4" /></button>
      </div>
    )},
  ], []);

  const table = useReactTable({
    data: assessments, columns,
    state: { sorting, globalFilter: search },
    onSortingChange: setSorting, onGlobalFilterChange: setSearch,
    getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(), getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Assessments" subtitle="Manage exams, CATs, and evaluations" action onAction={() => { setIsEdit(false); setEditingId(null); setFormData({ trade_id: '', subject_id: '', term_id: '', title: '', total_marks: '' }); setShowModal(true); }} actionLabel="New Assessment" actionIcon={Plus} />

      {/* Filters */}
      <div className="bg-white dark:bg-surface-900 rounded-2xl shadow-card border border-surface-100 dark:border-surface-800 p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-surface-500"><Filter className="w-4 h-4" /><span className="font-medium">Filters</span></div>
          <select value={filterTrade} onChange={(e) => setFilterTrade(e.target.value)} className="select-field w-auto min-w-[140px]"><option value="">All Trades</option>{trades.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
          <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} className="select-field w-auto min-w-[140px]"><option value="">All Subjects</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
          <select value={filterTerm} onChange={(e) => setFilterTerm(e.target.value)} className="select-field w-auto min-w-[140px]"><option value="">All Terms</option>{terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
          {(filterTrade || filterSubject || filterTerm) && (
            <button onClick={() => { setFilterTrade(''); setFilterSubject(''); setFilterTerm(''); }} className="text-sm text-surface-500 hover:text-surface-700 flex items-center gap-1"><X className="w-3.5 h-3.5" /> Clear</button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-surface-900 rounded-2xl shadow-card border border-surface-100 dark:border-surface-800 overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center"><div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : assessments.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No Assessments" description="Create your first assessment to get started." action="New Assessment" onAction={() => setShowModal(true)} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>{table.getHeaderGroups().map(hg => (
                  <tr key={hg.id} className="border-b border-surface-100 dark:border-surface-800">
                    {hg.headers.map(h => (
                      <th key={h.id} onClick={h.column.getToggleSortingHandler()}
                        className="px-6 py-3 text-left text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider cursor-pointer hover:text-surface-700 dark:hover:text-surface-300 transition-colors">
                        <div className="flex items-center gap-1">{flexRender(h.column.columnDef.header, h.getContext())}{{ asc: <ChevronUp className="w-3 h-3" />, desc: <ChevronDown className="w-3 h-3" /> }[h.column.getIsSorted()] || <ChevronsUpDown className="w-3 h-3 opacity-30" />}</div>
                      </th>
                    ))}
                  </tr>
                ))}</thead>
                <tbody>{table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="border-b border-surface-50 dark:border-surface-800/50 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-6 py-3 text-sm text-surface-700 dark:text-surface-300">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-6 py-3 border-t border-surface-100 dark:border-surface-800">
              <p className="text-sm text-surface-500">Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)} of {table.getFilteredRowModel().rows.length}</p>
              <div className="flex items-center gap-1">
                <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="p-1.5 rounded-lg text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-30 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="p-1.5 rounded-lg text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-30 transition-colors"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={isEdit ? 'Edit Assessment' : 'New Assessment'} maxWidth="max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Trade *</label><select value={formData.trade_id} onChange={(e) => setFormData({ ...formData, trade_id: e.target.value })} className="select-field" required><option value="">Select Trade</option>{trades.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Subject *</label><select value={formData.subject_id} onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })} className="select-field" required><option value="">Select Subject</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          </div>
          <div><label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Term *</label><select value={formData.term_id} onChange={(e) => setFormData({ ...formData, term_id: e.target.value })} className="select-field" required><option value="">Select Term</option>{terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Title *</label><input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="input-field" placeholder="e.g. Mid-term Exam" required /></div>
          <div><label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Total Marks *</label><input type="number" min="1" value={formData.total_marks} onChange={(e) => setFormData({ ...formData, total_marks: e.target.value })} className="input-field" placeholder="e.g. 100" required /></div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>{isEdit ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={deleteConfirm} onClose={() => { setDeleteConfirm(false); setDeleteId(null); }} onConfirm={() => handleDelete(deleteId)} title="Delete Assessment?" message="This action cannot be undone. All associated marks may be affected." confirmText="Delete" />
    </div>
  );
}
