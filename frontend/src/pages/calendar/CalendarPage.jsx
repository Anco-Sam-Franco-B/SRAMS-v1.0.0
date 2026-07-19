import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';
import { Plus, Calendar as CalendarIcon } from 'lucide-react';

export default function CalendarPage() {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', event_type: 'event', start_date: '', end_date: '' });
  const queryClient = useQueryClient();

  const { data: events } = useQuery({
    queryKey: ['calendar-events'],
    queryFn: () => api.get('/calendar').then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/calendar', data),
    onSuccess: () => { queryClient.invalidateQueries(['calendar-events']); setShowModal(false); toast.success('Event created'); },
  });

  const typeColors = { exam: 'danger', holiday: 'success', meeting: 'info', event: 'primary' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-surface-100">School Calendar</h1>
        <Button icon={Plus} onClick={() => setShowModal(true)}>Add Event</Button>
      </div>
      {events && events.length > 0 ? (
        <div className="space-y-3">
          {events.map((e) => (
            <Card key={e.id} hover>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-brand-50 dark:bg-brand-500/10 rounded-lg"><CalendarIcon className="w-5 h-5 text-brand-600" /></div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-surface-100">{e.title}</h3>
                    {e.description && <p className="text-sm text-gray-500 mt-1">{e.description}</p>}
                    <p className="text-xs text-gray-400 mt-2">{new Date(e.start_date).toLocaleDateString()} {e.end_date ? `- ${new Date(e.end_date).toLocaleDateString()}` : ''}</p>
                  </div>
                </div>
                <Badge variant={typeColors[e.event_type] || 'info'}>{e.event_type}</Badge>
              </div>
            </Card>
          ))}
        </div>
      ) : <EmptyState title="No events" description="Add school calendar events" action="Add Event" onAction={() => setShowModal(true)} />}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Event">
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Select label="Type" value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })} options={[{ value: 'event', label: 'Event' }, { value: 'exam', label: 'Exam' }, { value: 'holiday', label: 'Holiday' }, { value: 'meeting', label: 'Meeting' }]} />
          <Input label="Start Date" type="datetime-local" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required />
          <Input label="End Date" type="datetime-local" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
          <div className="flex justify-end gap-3 pt-2"><Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button><Button type="submit" loading={createMutation.isPending}>Create</Button></div>
        </form>
      </Modal>
    </div>
  );
}
