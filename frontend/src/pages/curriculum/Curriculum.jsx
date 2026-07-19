import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/Dialog';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, BookOpen } from 'lucide-react';

export default function Curriculum() {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'course_grade', subject_id: '', class_id: '', description: '' });
  const queryClient = useQueryClient();

  const { data: items } = useQuery({ queryKey: ['curriculum'], queryFn: () => api.get('/curriculum').then((r) => r.data.data) });
  const { data: subjects } = useQuery({ queryKey: ['subjects'], queryFn: () => api.get('/subjects').then((r) => r.data.data) });
  const { data: classes } = useQuery({ queryKey: ['classes'], queryFn: () => api.get('/classes').then((r) => r.data.data) });

  const createMutation = useMutation({ mutationFn: (data) => api.post('/curriculum', data), onSuccess: () => { queryClient.invalidateQueries(['curriculum']); setShowModal(false); toast.success('Curriculum created'); } });
  const updateMutation = useMutation({ mutationFn: (data) => api.put(`/curriculum/${editItem.id}`, data), onSuccess: () => { queryClient.invalidateQueries(['curriculum']); setShowModal(false); setEditItem(null); toast.success('Curriculum updated'); } });
  const deleteMutation = useMutation({ mutationFn: (id) => api.delete(`/curriculum/${id}`), onSuccess: () => { queryClient.invalidateQueries(['curriculum']); toast.success('Curriculum deleted'); } });

  const openEdit = (item) => { setEditItem(item); setForm({ name: item.name, type: item.type, subject_id: item.subject_id || '', class_id: item.class_id || '', description: item.description || '' }); setShowModal(true); };
  const handleSubmit = (e) => { e.preventDefault(); editItem ? updateMutation.mutate(form) : createMutation.mutate(form); };
  const typeLabels = { course_grade: 'Course Grade', legra: 'Legra', standard: 'Standard' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Curriculum</h1><p className="text-sm text-muted-foreground mt-1">Manage curriculum and materials</p></div>
        <Button onClick={() => { setEditItem(null); setForm({ name: '', type: 'course_grade', subject_id: '', class_id: '', description: '' }); setShowModal(true); }}><Plus className="h-4 w-4" /> Add Curriculum</Button>
      </div>
      {items && items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((c) => (
            <Card key={c.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg"><BookOpen className="h-5 w-5 text-primary" /></div>
                  <div><h3 className="font-semibold">{c.name}</h3><p className="text-sm text-muted-foreground">{typeLabels[c.type] || c.type}</p></div>
                </div>
              </div>
              <div className="mt-4 space-y-1 text-sm text-muted-foreground">
                {c.subject_name && <p>Subject: {c.subject_name}</p>}
                {c.class_name && <p>Class: {c.class_name}</p>}
                <p>Materials: {c.material_count || 0}</p>
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t">
                <Button variant="ghost" size="sm" onClick={() => openEdit(c)}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </Card>
          ))}
        </div>
      ) : <EmptyState title="No curriculum" description="Add curriculum items" action="Add Curriculum" onAction={() => setShowModal(true)} />}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editItem ? 'Edit Curriculum' : 'Add Curriculum'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} options={[{ value: 'course_grade', label: 'Course Grade' }, { value: 'legra', label: 'Legra' }, { value: 'standard', label: 'Standard' }]} />
            <Select label="Subject" value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })} options={subjects?.map((s) => ({ value: s.id, label: s.name })) || []} />
            <Select label="Class" value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })} options={classes?.map((c) => ({ value: c.id, label: c.name })) || []} />
            <div className="space-y-1.5"><label className="text-sm font-medium">Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="flex w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" /></div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>{editItem ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
