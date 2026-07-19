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
import { Plus, Edit, Trash2, Send } from 'lucide-react';

export default function Submissions() {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ entity_type: 'sei', entity_name: '', total_items: '', deadline: '' });
  const queryClient = useQueryClient();

  const { data: items } = useQuery({ queryKey: ['submissions'], queryFn: () => api.get('/submissions').then((r) => r.data.data) });

  const createMutation = useMutation({ mutationFn: (data) => api.post('/submissions', data), onSuccess: () => { queryClient.invalidateQueries(['submissions']); setShowModal(false); toast.success('Submission created'); } });
  const updateMutation = useMutation({ mutationFn: (data) => api.put(`/submissions/${editItem.id}`, data), onSuccess: () => { queryClient.invalidateQueries(['submissions']); setShowModal(false); setEditItem(null); toast.success('Submission updated'); } });
  const deleteMutation = useMutation({ mutationFn: (id) => api.delete(`/submissions/${id}`), onSuccess: () => { queryClient.invalidateQueries(['submissions']); toast.success('Submission deleted'); } });

  const openEdit = (item) => { setEditItem(item); setForm({ entity_type: item.entity_type, entity_name: item.entity_name, total_items: String(item.total_items || ''), deadline: item.deadline || '' }); setShowModal(true); };
  const handleSubmit = (e) => { e.preventDefault(); const data = { ...form, total_items: Number(form.total_items) }; editItem ? updateMutation.mutate(data) : createMutation.mutate(data); };
  const statusColors = { pending: 'secondary', in_progress: 'info', complete: 'success' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Submission Progress</h1><p className="text-sm text-muted-foreground mt-1">Track SEI and District submissions</p></div>
        <Button onClick={() => { setEditItem(null); setForm({ entity_type: 'sei', entity_name: '', total_items: '', deadline: '' }); setShowModal(true); }}><Plus className="h-4 w-4" /> Add Submission</Button>
      </div>
      {items && items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const progress = item.total_items > 0 ? (item.submitted_items / item.total_items) * 100 : 0;
            return (
              <Card key={item.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg"><Send className="h-5 w-5 text-primary" /></div>
                    <div><h3 className="font-semibold">{item.entity_name}</h3><p className="text-sm text-muted-foreground capitalize">{item.entity_type}</p></div>
                  </div>
                  <Badge variant={statusColors[item.status] || 'secondary'}>{item.status}</Badge>
                </div>
                <div className="mt-4 space-y-3">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Submitted: {item.submitted_items}/{item.total_items}</span><span className="text-muted-foreground">{progress.toFixed(0)}%</span></div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} /></div>
                  {item.deadline && <p className="text-xs text-muted-foreground">Deadline: {new Date(item.deadline).toLocaleDateString()}</p>}
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(item)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : <EmptyState title="No submissions" description="Track SEI and district submissions" action="Add Submission" onAction={() => setShowModal(true)} />}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editItem ? 'Edit Submission' : 'Add Submission'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select label="Type" value={form.entity_type} onChange={(e) => setForm({ ...form, entity_type: e.target.value })} options={[{ value: 'sei', label: 'SEI' }, { value: 'district', label: 'District' }]} />
            <Input label="Name" value={form.entity_name} onChange={(e) => setForm({ ...form, entity_name: e.target.value })} required />
            <Input label="Total Items" type="number" value={form.total_items} onChange={(e) => setForm({ ...form, total_items: e.target.value })} />
            <Input label="Deadline" type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
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
