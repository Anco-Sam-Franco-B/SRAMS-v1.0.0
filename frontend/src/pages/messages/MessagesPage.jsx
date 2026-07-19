import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import Avatar from '../../components/ui/Avatar';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';
import { Send, Inbox, MailOpen } from 'lucide-react';

export default function MessagesPage() {
  const [tab, setTab] = useState('inbox');
  const [showCompose, setShowCompose] = useState(false);
  const [form, setForm] = useState({ recipient_id: '', subject: '', body: '' });
  const queryClient = useQueryClient();

  const { data: inbox } = useQuery({ queryKey: ['messages', 'inbox'], queryFn: () => api.get('/messages/inbox').then((r) => r.data.data) });
  const { data: sent } = useQuery({ queryKey: ['messages', 'sent'], queryFn: () => api.get('/messages/sent').then((r) => r.data.data) });
  const { data: users } = useQuery({ queryKey: ['users'], queryFn: () => api.get('/users').then((r) => r.data.data) });

  const sendMutation = useMutation({
    mutationFn: (data) => api.post('/messages', data),
    onSuccess: () => { queryClient.invalidateQueries(['messages']); setShowCompose(false); toast.success('Message sent'); },
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => api.put(`/messages/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries(['messages']),
  });

  const messages = tab === 'inbox' ? inbox : sent;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-surface-100">Messages</h1>
        <Button icon={Send} onClick={() => setShowCompose(true)}>Compose</Button>
      </div>
      <div className="flex gap-1 bg-surface-100 dark:bg-surface-800 rounded-xl p-1">
        <button onClick={() => setTab('inbox')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'inbox' ? 'bg-white dark:bg-surface-700 shadow-sm text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}><Inbox className="w-4 h-4 inline mr-1.5" />Inbox</button>
        <button onClick={() => setTab('sent')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'sent' ? 'bg-white dark:bg-surface-700 shadow-sm text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}><Send className="w-4 h-4 inline mr-1.5" />Sent</button>
      </div>
      <Card>
        {messages && messages.length > 0 ? (
          <div className="divide-y divide-surface-100 dark:divide-surface-800">
            {messages.map((m) => (
              <div key={m.id} className={`flex items-start gap-3 p-4 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors cursor-pointer ${!m.is_read && tab === 'inbox' ? 'bg-brand-50/50 dark:bg-brand-500/5' : ''}`} onClick={() => { if (tab === 'inbox' && !m.is_read) markReadMutation.mutate(m.id); }}>
                <Avatar name={tab === 'inbox' ? m.sender_name : m.recipient_name} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-medium text-gray-900 dark:text-surface-100 ${!m.is_read && tab === 'inbox' ? 'font-semibold' : ''}`}>{tab === 'inbox' ? m.sender_name : m.recipient_name}</p>
                    <span className="text-xs text-gray-400">{new Date(m.created_at).toLocaleDateString()}</span>
                  </div>
                  {m.subject && <p className="text-sm text-gray-700 dark:text-surface-300 font-medium">{m.subject}</p>}
                  <p className="text-sm text-gray-500 truncate">{m.body}</p>
                </div>
                {!m.is_read && tab === 'inbox' && <div className="w-2 h-2 bg-brand-600 rounded-full mt-2" />}
              </div>
            ))}
          </div>
        ) : <EmptyState title={`No ${tab} messages`} description={tab === 'inbox' ? 'Your inbox is empty' : 'No messages sent yet'} />}
      </Card>

      <Modal isOpen={showCompose} onClose={() => setShowCompose(false)} title="Compose Message">
        <form onSubmit={(e) => { e.preventDefault(); sendMutation.mutate(form); }} className="space-y-4">
          <Select label="To" value={form.recipient_id} onChange={(e) => setForm({ ...form, recipient_id: e.target.value })} options={users?.map((u) => ({ value: u.id, label: `${u.first_name} ${u.last_name}` })) || []} required />
          <Input label="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          <div className="space-y-1.5"><label className="block text-sm font-medium">Message</label><textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={4} className="w-full bg-white dark:bg-surface-800 rounded-xl px-4 py-2.5 text-sm border border-surface-200 dark:border-surface-700 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 outline-none" required /></div>
          <div className="flex justify-end gap-3 pt-2"><Button variant="secondary" type="button" onClick={() => setShowCompose(false)}>Cancel</Button><Button type="submit" loading={sendMutation.isPending}>Send</Button></div>
        </form>
      </Modal>
    </div>
  );
}
