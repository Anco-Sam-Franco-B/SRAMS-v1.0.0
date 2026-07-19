import { useEffect, useState, useMemo } from 'react';
import { useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel, getPaginationRowModel, flexRender } from '@tanstack/react-table';
import { Plus, Search, Pencil, Trash2, Eye, ChevronUp, ChevronDown, ChevronsUpDown, Download, X, Loader2, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../api/client';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sorting, setSorting] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', date_of_birth: '', gender: '', trade_id: '', class_id: '' });
  const [trades, setTrades] = useState([]);
  const [classes, setClasses] = useState([]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/students');
      setStudents(res.data.data || []);
    } catch (e) { toast.error('Failed to fetch students'); }
    finally { setLoading(false); }
  };

  const fetchTrades = async () => {
    try { const res = await api.get('/trades'); setTrades(res.data.data || []); } catch {}
  };

  const fetchClasses = async (tradeId) => {
    try {
      const url = tradeId ? `/classes?trade_id=${tradeId}` : '/classes';
      const res = await api.get(url); setClasses(res.data.data || []);
    } catch {}
  };

  useEffect(() => { fetchStudents(); fetchTrades(); }, []);
  useEffect(() => { if (form.trade_id) fetchClasses(form.trade_id); }, [form.trade_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        await api.put(`/students/${editing.id}`, form);
        toast.success('Student updated');
      } else {
        await api.post('/students', form);
        toast.success('Student created');
      }
      setShowModal(false); setEditing(null); setForm({ first_name: '', last_name: '', email: '', phone: '', date_of_birth: '', gender: '', trade_id: '', class_id: '' });
      fetchStudents();
    } catch (err) { toast.error(err?.response?.data?.error || 'Failed to save student'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await api.delete(`/students/${deleting.id}`);
      toast.success('Student deleted');
      setDeleting(null); fetchStudents();
    } catch (err) { toast.error(err?.response?.data?.error || 'Failed to delete'); }
  };

  const openEdit = (student) => {
    setEditing(student);
    setForm({ first_name: student.first_name || '', last_name: student.last_name || '', email: student.email || '', phone: student.phone || '', date_of_birth: student.date_of_birth?.split('T')[0] || '', gender: student.gender || '', trade_id: student.trade_id || '', class_id: student.class_id || '' });
    setShowModal(true);
  };

  const columns = useMemo(() => [
    { accessorKey: 'admission_no', header: 'Adm No', cell: ({ row }) => <span className="font-mono text-xs">{row.original.admission_no}</span> },
    { accessorKey: 'first_name', header: 'Name', cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
          {(row.original.first_name?.[0] || '') + (row.original.last_name?.[0] || '')}
        </div>
        <div>
          <p className="text-sm font-medium text-surface-900 dark:text-surface-100">{row.original.first_name} {row.original.last_name}</p>
          <p className="text-xs text-surface-400">{row.original.email || ''}</p>
        </div>
      </div>
    )},
    { accessorKey: 'gender', header: 'Gender', cell: ({ row }) => <Badge variant={row.original.gender === 'Male' ? 'info' : 'purple'}>{row.original.gender || 'N/A'}</Badge> },
    { accessorKey: 'trade_name', header: 'Trade', cell: ({ row }) => row.original.trade_name || 'N/A' },
    { accessorKey: 'class_name', header: 'Class', cell: ({ row }) => row.original.class_name || 'N/A' },
    { accessorKey: 'created_at', header: 'Enrolled', cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString() },
    { id: 'actions', header: '', cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <button onClick={() => setShowDetail(row.original)} className="p-1.5 rounded-lg text-surface-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"><Eye className="w-4 h-4" /></button>
        <button onClick={() => openEdit(row.original)} className="p-1.5 rounded-lg text-surface-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"><Pencil className="w-4 h-4" /></button>
        <button onClick={() => setDeleting(row.original)} className="p-1.5 rounded-lg text-surface-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 className="w-4 h-4" /></button>
      </div>
    )},
  ], []);

  const table = useReactTable({
    data: students,
    columns,
    state: { sorting, globalFilter: search },
    onSortingChange: setSorting,
    onGlobalFilterChange: setSearch,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Students" subtitle={`Manage ${students.length} students`} action onAction={() => { setEditing(null); setForm({ first_name: '', last_name: '', email: '', phone: '', date_of_birth: '', gender: '', trade_id: '', class_id: '' }); setShowModal(true); }} actionLabel="Add Student" actionIcon={Plus} />

      {/* Search & Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search students..."
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-surface-900 rounded-2xl shadow-card border border-surface-100 dark:border-surface-800 overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary-600" /></div>
        ) : students.length === 0 ? (
          <EmptyState icon={Users} title="No Students" description="No students have been registered yet." action="Add Student" onAction={() => setShowModal(true)} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id} className="border-b border-surface-100 dark:border-surface-800">
                      {headerGroup.headers.map(header => (
                        <th key={header.id} onClick={header.column.getToggleSortingHandler()}
                          className="px-6 py-3 text-left text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider cursor-pointer hover:text-surface-700 dark:hover:text-surface-300 transition-colors">
                          <div className="flex items-center gap-1">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {{ asc: <ChevronUp className="w-3 h-3" />, desc: <ChevronDown className="w-3 h-3" /> }[header.column.getIsSorted()] || <ChevronsUpDown className="w-3 h-3 opacity-30" />}
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map(row => (
                    <tr key={row.id} className="border-b border-surface-50 dark:border-surface-800/50 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="px-6 py-3 text-sm text-surface-700 dark:text-surface-300">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-surface-100 dark:border-surface-800">
              <p className="text-sm text-surface-500">Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)} of {table.getFilteredRowModel().rows.length}</p>
              <div className="flex items-center gap-1">
                <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-30 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-30 transition-colors"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditing(null); }} title={editing ? 'Edit Student' : 'Add New Student'} maxWidth="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">First Name *</label><input required value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Last Name *</label><input required value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Email</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Phone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Date of Birth</label><input type="date" value={form.date_of_birth} onChange={e => setForm({ ...form, date_of_birth: e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Gender</label><select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} className="select-field"><option value="">Select</option><option>Male</option><option>Female</option></select></div>
            <div><label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Trade</label><select value={form.trade_id} onChange={e => setForm({ ...form, trade_id: e.target.value })} className="select-field"><option value="">Select Trade</option>{trades.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Class</label><select value={form.class_id} onChange={e => setForm({ ...form, class_id: e.target.value })} className="select-field"><option value="">Select Class</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => { setShowModal(false); setEditing(null); }}>Cancel</Button>
            <Button type="submit" loading={submitting}>{editing ? 'Update' : 'Create'} Student</Button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title="Student Details" maxWidth="max-w-lg">
        {showDetail && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center text-xl font-bold">
                {(showDetail.first_name?.[0] || '') + (showDetail.last_name?.[0] || '')}
              </div>
              <div>
                <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100">{showDetail.first_name} {showDetail.last_name}</h3>
                <p className="text-sm text-surface-500">{showDetail.admission_no}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[['Email', showDetail.email], ['Phone', showDetail.phone], ['Gender', showDetail.gender], ['DOB', showDetail.date_of_birth?.split('T')[0]], ['Trade', showDetail.trade_name], ['Class', showDetail.class_name]].map(([label, value]) => (
                <div key={label} className="p-3 rounded-xl bg-surface-50 dark:bg-surface-800">
                  <p className="text-xs text-surface-400 mb-0.5">{label}</p>
                  <p className="text-sm font-medium text-surface-900 dark:text-surface-100">{value || 'N/A'}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog isOpen={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} title="Delete Student" message={`Are you sure you want to delete ${deleting?.first_name} ${deleting?.last_name}? This action cannot be undone.`} confirmText="Delete" />
    </div>
  );
}
