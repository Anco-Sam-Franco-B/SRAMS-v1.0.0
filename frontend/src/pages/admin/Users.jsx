import { useEffect, useState, useCallback, useMemo } from 'react';
import { useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel, getPaginationRowModel, flexRender } from '@tanstack/react-table';
import { Plus, Search, Trash2, PowerCircle, PowerOff, X, Loader2, ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, Users as UsersIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../api/client';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Avatar from '../../components/ui/Avatar';
import EmptyState from '../../components/ui/EmptyState';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sorting, setSorting] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formData, setFormData] = useState({ first_name: '', last_name: '', email: '', password: '', role_id: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        api.get('/users'),
        api.get('/data/roles'),
      ]);
      setUsers(usersRes.data.data || []);
      setRoles(rolesRes.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getRoleName = (roleId) => {
    const role = roles.find((r) => r.id === roleId);
    return role ? role.name : 'Unassigned';
  };

  const getRoleBadgeVariant = (roleName) => {
    if (roleName.includes('Admin') || roleName.includes('Head')) return 'danger';
    if (roleName.includes('Teacher') || roleName.includes('Director')) return 'info';
    if (roleName.includes('Student')) return 'success';
    return 'neutral';
  };

  const handleRoleChange = async (userId, newRoleId) => {
    try {
      await api.put(`/users/${userId}/role`, { role_id: newRoleId });
      toast.success('Role updated');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to change role');
    }
  };

  const handleToggleActive = async (user) => {
    try {
      await api.put(`/users/${user.id}/toggle-active`);
      toast.success(`User ${user.is_active ? 'deactivated' : 'activated'}`);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to toggle status');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/users', formData);
      toast.success('User created successfully');
      setIsModalOpen(false);
      setFormData({ first_name: '', last_name: '', email: '', password: '', role_id: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/users/${deleteTarget.id}`);
      toast.success('User deleted');
      setDeleteTarget(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete user');
    }
  };

  const columns = useMemo(() => [
    {
      accessorKey: 'name', header: 'User',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar name={`${row.original.first_name} ${row.original.last_name}`} size="sm" />
          <div>
            <p className="text-sm font-medium text-surface-900 dark:text-surface-100">{row.original.first_name} {row.original.last_name}</p>
            <p className="text-xs text-surface-400">{row.original.email}</p>
          </div>
        </div>
      ),
      accessorFn: (row) => `${row.first_name} ${row.last_name}`,
    },
    {
      accessorKey: 'role_id', header: 'Role',
      cell: ({ row }) => {
        const roleName = getRoleName(row.original.role_id);
        return (
          <select
            value={row.original.role_id || ''}
            onChange={(e) => handleRoleChange(row.original.id, e.target.value)}
            className="bg-transparent border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 text-xs rounded-lg px-2 py-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          >
            {roles.map((role) => (
              <option key={role.id} value={role.id}>{role.name}</option>
            ))}
          </select>
        );
      },
    },
    {
      accessorKey: 'is_active', header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? 'success' : 'danger'} dot>
          {row.original.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      accessorKey: 'created_at', header: 'Created',
      cell: ({ row }) => <span className="text-xs text-surface-500">{row.original.created_at ? new Date(row.original.created_at).toLocaleDateString() : 'N/A'}</span>,
    },
    {
      id: 'actions', header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button onClick={() => handleToggleActive(row.original)}
            className="p-1.5 rounded-lg text-surface-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
            title={row.original.is_active ? 'Deactivate' : 'Activate'}>
            {row.original.is_active ? <PowerOff className="w-4 h-4" /> : <PowerCircle className="w-4 h-4" />}
          </button>
          <button onClick={() => setDeleteTarget(row.original)}
            className="p-1.5 rounded-lg text-surface-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Delete user">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ], [roles]);

  const table = useReactTable({
    data: users,
    columns,
    state: { sorting, globalFilter: search },
    onSortingChange: setSorting,
    onGlobalFilterChange: setSearch,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: { pagination: { pageSize: 10 } },
    globalFilterFn: (row, columnId, filterValue) => {
      const name = `${row.original.first_name} ${row.original.last_name}`.toLowerCase();
      const email = row.original.email?.toLowerCase() || '';
      return name.includes(filterValue.toLowerCase()) || email.includes(filterValue.toLowerCase());
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="System Users" subtitle={`Manage ${users.length} users and their roles`} action onAction={() => { setFormData({ first_name: '', last_name: '', email: '', password: '', role_id: '' }); setIsModalOpen(true); }} actionLabel="Add User" actionIcon={Plus} />

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-surface-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..."
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-surface-900 rounded-2xl shadow-card border border-surface-100 dark:border-surface-800 overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary-600" /></div>
        ) : users.length === 0 ? (
          <EmptyState icon={UsersIcon} title="No Users" description="No users have been created yet." action="Add User" onAction={() => setIsModalOpen(true)} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  {table.getHeaderGroups().map(hg => (
                    <tr key={hg.id} className="border-b border-surface-100 dark:border-surface-800">
                      {hg.headers.map(h => (
                        <th key={h.id} onClick={h.column.getToggleSortingHandler()}
                          className="px-6 py-3 text-left text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider cursor-pointer hover:text-surface-700 dark:hover:text-surface-300 transition-colors">
                          <div className="flex items-center gap-1">
                            {flexRender(h.column.columnDef.header, h.getContext())}
                            {{ asc: <ChevronUp className="w-3 h-3" />, desc: <ChevronDown className="w-3 h-3" /> }[h.column.getIsSorted()] || <ChevronsUpDown className="w-3 h-3 opacity-30" />}
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

      {/* Create User Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New User" maxWidth="max-w-md">
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">First Name *</label><input required type="text" name="first_name" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Last Name *</label><input required type="text" name="last_name" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} className="input-field" /></div>
          </div>
          <div><label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Email *</label><input required type="email" name="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="input-field" /></div>
          <div><label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Password *</label><input required type="password" name="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="input-field" minLength={8} /></div>
          <div><label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Role *</label>
            <select required name="role_id" value={formData.role_id} onChange={(e) => setFormData({ ...formData, role_id: e.target.value })} className="select-field">
              <option value="">Select Role</option>
              {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Create User</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete User" message={`Are you sure you want to delete ${deleteTarget?.first_name} ${deleteTarget?.last_name}? This action cannot be undone.`} confirmText="Delete" />
    </div>
  );
}
