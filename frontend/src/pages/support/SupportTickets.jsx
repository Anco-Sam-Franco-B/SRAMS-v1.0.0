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
import { Plus, Edit, Trash2, HelpCircle } from 'lucide-react';

export default function SupportTickets() {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ subject: '', description: '', priority: 'normal' });
  const queryClient = useQueryClient();

  const { data: tickets } = useQuery({ queryKey: ['support-tickets'], queryFn: () => api.get('/support').then((r) => r.data.data) });

  const createMutation = useMutation({ mutationFn: (data) => api.post('/support', data), onSuccess: () => { queryClient.invalidateQueries(['support-tickets']); setShowModal(false); toast.success('Ticket created'); } });
  const updateMutation = useMutation({ mutationFn: (data) => api.put(`/support/${editItem.id}`, data), onSuccess: () => { queryClient.invalidateQueries(['support-tickets']); setShowModal(false); setEditItem(null); toast.success('Ticket updated'); } });
  const deleteMutation = useMutation({ mutationFn: (id) => api.delete(`/support/${id}`), onSuccess: () => { queryClient.invalidateQueries(['support-tickets']); toast.success('Ticket deleted'); } });

  const handleSubmit = (e) => { e.preventDefault(); editItem ? updateMutation.mutate(form) : createMutation.mutate(form); };
  const statusColors = { open: 'warning', in_progress: 'info', resolved: 'success', closed: 'secondary' };
  const priorityColors = { low: 'secondary', normal: 'info', high: 'warning', urgent: 'destructive' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Support Tickets</h1><p className="text-sm text-muted-foreground mt-1">System support and issue tracking</p></div>
        <Button onClick={() => { setEditItem(null); setForm({ subject: '', description: '', priority: 'normal' }); setShowModal(true); }}><Plus className="h-4 w-4" /> New Ticket</Button>
      </div>
      {tickets && tickets.length > 0 ? (
        <div className="space-y-3">
          {tickets.map((t) => (
            <Card key={t.id} className="p-4 flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-primary/10 rounded-lg"><HelpCircle className="h-5 w-5 text-primary" /></div>
                <div>
                  <h3 className="font-semibold">{t.subject}</h3>
                  <p className="text-sm text-muted-foreground truncate max-w-md">{t.description}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">{t.user_name}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={priorityColors[t.priority]}>{t.priority}</Badge>
                <Badge variant={statusColors[t.status]}>{t.status}</Badge>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => { setEditItem(t); setForm({ subject: t.subject, description: t.description, priority: t.priority }); setShowModal(true); }}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : <EmptyState title="No tickets" description="No support tickets yet" action="New Ticket" onAction={() => setShowModal(true)} />}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editItem ? 'Edit Ticket' : 'New Support Ticket'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
            <div className="space-y-1.5"><label className="text-sm font-medium">Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="flex w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" required /></div>
            <Select label="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} options={[{ value: 'low', label: 'Low' }, { value: 'normal', label: 'Normal' }, { value: 'high', label: 'High' }, { value: 'urgent', label: 'Urgent' }]} />
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
