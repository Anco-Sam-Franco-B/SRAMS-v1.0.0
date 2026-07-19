import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/Dialog';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Target, Play } from 'lucide-react';

export default function ImihigoDashboard() {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', target_value: '', period: '' });
  const queryClient = useQueryClient();

  const { data: items } = useQuery({ queryKey: ['imihigo'], queryFn: () => api.get('/imihigo').then((r) => r.data.data) });

  const createMutation = useMutation({ mutationFn: (data) => api.post('/imihigo', data), onSuccess: () => { queryClient.invalidateQueries(['imihigo']); setShowModal(false); toast.success('Imihigo created'); } });
  const updateMutation = useMutation({ mutationFn: (data) => api.put(`/imihigo/${editItem.id}`, data), onSuccess: () => { queryClient.invalidateQueries(['imihigo']); setShowModal(false); setEditItem(null); toast.success('Imihigo updated'); } });
  const deleteMutation = useMutation({ mutationFn: (id) => api.delete(`/imihigo/${id}`), onSuccess: () => { queryClient.invalidateQueries(['imihigo']); toast.success('Imihigo deleted'); } });

  const openEdit = (item) => { setEditItem(item); setForm({ title: item.title, description: item.description || '', target_value: String(item.target_value || ''), period: item.period || '' }); setShowModal(true); };
  const handleSubmit = (e) => { e.preventDefault(); const data = { ...form, target_value: Number(form.target_value) }; editItem ? updateMutation.mutate(data) : createMutation.mutate(data); };
  const statusColors = { active: 'success', completed: 'info', expired: 'secondary' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Imihigo (Performance Contracts)</h1><p className="text-sm text-muted-foreground mt-1">Track performance targets and achievements</p></div>
        <Button onClick={() => { setEditItem(null); setForm({ title: '', description: '', target_value: '', period: '' }); setShowModal(true); }}><Plus className="h-4 w-4" /> Add Imihigo</Button>
      </div>
      {items && items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const progress = item.target_value > 0 ? Math.min(100, (item.actual_value / item.target_value) * 100) : 0;
            return (
              <Card key={item.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg"><Target className="h-5 w-5 text-primary" /></div>
                    <div><h3 className="font-semibold">{item.title}</h3><p className="text-sm text-muted-foreground">{item.period}</p></div>
                  </div>
                  <Badge variant={statusColors[item.status] || 'secondary'}>{item.status}</Badge>
                </div>
                <div className="mt-4 space-y-3">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Target: {item.target_value}</span><span className="text-muted-foreground">Actual: {item.actual_value}</span></div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} /></div>
                  <p className="text-xs text-muted-foreground text-right">{progress.toFixed(0)}% complete</p>
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(item)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : <EmptyState title="No imihigo" description="Create performance contracts" action="Add Imihigo" onAction={() => setShowModal(true)} />}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editItem ? 'Edit Imihigo' : 'Add Imihigo'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <Input label="Target Value" type="number" value={form.target_value} onChange={(e) => setForm({ ...form, target_value: e.target.value })} />
            <Input label="Period" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} placeholder="e.g., term1_2026" />
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
