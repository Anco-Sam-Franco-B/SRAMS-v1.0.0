import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';
import { Plus, Megaphone, Send } from 'lucide-react';

export default function AnnouncementsPage() {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', priority: 'normal', audience: 'all' });
  const queryClient = useQueryClient();

  const { data: announcements } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => api.get('/announcements').then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/announcements', { ...data, audience: [data.audience] }),
    onSuccess: () => { queryClient.invalidateQueries(['announcements']); setShowModal(false); toast.success('Announcement created'); },
  });

  const publishMutation = useMutation({
    mutationFn: (id) => api.post(`/announcements/${id}/publish`),
    onSuccess: () => { queryClient.invalidateQueries(['announcements']); toast.success('Published'); },
  });

  const priorityColors = { low: 'neutral', normal: 'info', high: 'warning', urgent: 'danger' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-surface-100">Announcements</h1>
        <Button icon={Plus} onClick={() => setShowModal(true)}>New Announcement</Button>
      </div>
      {announcements && announcements.length > 0 ? (
        <div className="space-y-3">
          {announcements.map((a) => (
            <Card key={a.id} hover>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-50 dark:bg-amber-500/10 rounded-lg"><Megaphone className="w-5 h-5 text-amber-600" /></div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-surface-100">{a.title}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{a.content}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-400">{new Date(a.created_at).toLocaleDateString()}</span>
                      {a.audience && <span className="text-xs text-gray-400">To: {a.audience.join(', ')}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={priorityColors[a.priority]}>{a.priority}</Badge>
                  {a.published ? <Badge variant="success">Published</Badge> : <Button size="sm" variant="outline" icon={Send} onClick={() => publishMutation.mutate(a.id)}>Publish</Button>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : <EmptyState title="No announcements" description="Create announcements for your school" action="New Announcement" onAction={() => setShowModal(true)} />}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Announcement">
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <div className="space-y-1.5"><label className="block text-sm font-medium text-gray-700 dark:text-surface-300">Content</label><textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={4} className="w-full bg-white dark:bg-surface-800 rounded-xl px-4 py-2.5 text-sm border border-surface-200 dark:border-surface-700 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 outline-none" required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><label className="block text-sm font-medium">Priority</label><select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full bg-white dark:bg-surface-800 rounded-xl px-4 py-2.5 text-sm border border-surface-200 dark:border-surface-700 outline-none"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></div>
            <div className="space-y-1.5"><label className="block text-sm font-medium">Audience</label><select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} className="w-full bg-white dark:bg-surface-800 rounded-xl px-4 py-2.5 text-sm border border-surface-200 dark:border-surface-700 outline-none"><option value="all">All</option><option value="teachers">Teachers</option><option value="students">Students</option><option value="parents">Parents</option></select></div>
          </div>
          <div className="flex justify-end gap-3 pt-2"><Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button><Button type="submit" loading={createMutation.isPending}>Create</Button></div>
        </form>
      </Modal>
    </div>
  );
}
