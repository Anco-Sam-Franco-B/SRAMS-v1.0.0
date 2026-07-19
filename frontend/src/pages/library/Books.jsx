import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import SearchInput from '../../components/ui/SearchInput';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2 } from 'lucide-react';

export default function Books() {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ title: '', author: '', isbn: '', category: '', total_copies: '1' });
  const queryClient = useQueryClient();

  const { data: books } = useQuery({
    queryKey: ['library-books', search],
    queryFn: () => api.get(`/library/books${search ? `?search=${search}` : ''}`).then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/library/books', data),
    onSuccess: () => { queryClient.invalidateQueries(['library-books']); setShowModal(false); setForm({ title: '', author: '', isbn: '', category: '', total_copies: '1' }); toast.success('Book added'); },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => api.put(`/library/books/${editItem.id}`, data),
    onSuccess: () => { queryClient.invalidateQueries(['library-books']); setShowModal(false); setEditItem(null); toast.success('Book updated'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/library/books/${id}`),
    onSuccess: () => { queryClient.invalidateQueries(['library-books']); setDeleteId(null); toast.success('Book deleted'); },
  });

  const openEdit = (book) => { setEditItem(book); setForm({ title: book.title, author: book.author || '', isbn: book.isbn || '', category: book.category || '', total_copies: String(book.total_copies) }); setShowModal(true); };
  const handleSubmit = (e) => { e.preventDefault(); const data = { ...form, total_copies: Number(form.total_copies) }; editItem ? updateMutation.mutate(data) : createMutation.mutate(data); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-surface-100">Library Books</h1>
        <Button icon={Plus} onClick={() => { setEditItem(null); setForm({ title: '', author: '', isbn: '', category: '', total_copies: '1' }); setShowModal(true); }}>Add Book</Button>
      </div>
      <SearchInput value={search} onChange={setSearch} placeholder="Search books..." className="max-w-sm" />
      {books && books.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {books.map((b) => (
            <Card key={b.id} hover>
              <div className="flex justify-between items-start">
                <div><h3 className="font-semibold text-gray-900 dark:text-surface-100">{b.title}</h3><p className="text-sm text-gray-500 mt-1">{b.author}</p>{b.isbn && <p className="text-xs text-gray-400 mt-1">ISBN: {b.isbn}</p>}</div>
                <div className="flex gap-1"><button onClick={() => openEdit(b)} className="p-1.5 rounded-lg hover:bg-surface-100"><Edit className="w-4 h-4 text-gray-500" /></button><button onClick={() => setDeleteId(b.id)} className="p-1.5 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4 text-red-500" /></button></div>
              </div>
              <div className="mt-3 flex items-center gap-4 text-sm"><span className="text-gray-500">Total: {b.total_copies}</span><span className="text-emerald-600 font-medium">Available: {b.available_copies}</span></div>
            </Card>
          ))}
        </div>
      ) : <EmptyState title="No books" description="Add books to your library" action="Add Book" onAction={() => setShowModal(true)} />}

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditItem(null); }} title={editItem ? 'Edit Book' : 'Add Book'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <Input label="Author" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
          <Input label="ISBN" value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} />
          <Input label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <Input label="Total Copies" type="number" value={form.total_copies} onChange={(e) => setForm({ ...form, total_copies: e.target.value })} required />
          <div className="flex justify-end gap-3 pt-2"><Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button><Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>{editItem ? 'Update' : 'Add'}</Button></div>
        </form>
      </Modal>
      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteMutation.mutate(deleteId)} title="Delete Book" message="Are you sure you want to delete this book?" loading={deleteMutation.isPending} />
    </div>
  );
}
