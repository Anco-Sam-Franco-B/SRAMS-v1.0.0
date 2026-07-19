import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/Dialog';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';
import { Send, RotateCcw } from 'lucide-react';

export default function ExamDistribution() {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ exam_paper_id: '', classroom_id: '' });
  const queryClient = useQueryClient();

  const { data: distributions } = useQuery({ queryKey: ['exam-distributions'], queryFn: () => api.get('/exam-papers/distributions').then((r) => r.data.data) });
  const { data: papers } = useQuery({ queryKey: ['exam-papers'], queryFn: () => api.get('/exam-papers').then((r) => r.data.data) });
  const { data: classrooms } = useQuery({ queryKey: ['classrooms'], queryFn: () => api.get('/classrooms').then((r) => r.data.data) });

  const createMutation = useMutation({ mutationFn: (data) => api.post('/exam-papers/distributions', data), onSuccess: () => { queryClient.invalidateQueries(['exam-distributions']); setShowModal(false); toast.success('Distribution created'); } });

  const handleSubmit = (e) => { e.preventDefault(); createMutation.mutate(form); };
  const statusColors = { pending: 'warning', distributed: 'success', returned: 'info' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Exam Distribution</h1><p className="text-sm text-muted-foreground mt-1">Track exam paper distribution to classrooms</p></div>
        <Button onClick={() => { setForm({ exam_paper_id: '', classroom_id: '' }); setShowModal(true); }}><Send className="h-4 w-4" /> Distribute Paper</Button>
      </div>
      {distributions && distributions.length > 0 ? (
        <div className="space-y-3">
          {distributions.map((d) => (
            <Card key={d.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-primary/10 rounded-lg"><Send className="h-5 w-5 text-primary" /></div>
                <div>
                  <h3 className="font-semibold">{d.exam_title}</h3>
                  <p className="text-sm text-muted-foreground">Classroom: {d.classroom_name} · To: {d.distributed_to_name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {d.distributed_at && `Distributed: ${new Date(d.distributed_at).toLocaleString()}`}
                    {d.returned_at && ` · Returned: ${new Date(d.returned_at).toLocaleString()}`}
                  </p>
                </div>
              </div>
              <Badge variant={statusColors[d.status]}>{d.status}</Badge>
            </Card>
          ))}
        </div>
      ) : <EmptyState title="No distributions" description="Distribute exam papers to classrooms" action="Distribute Paper" onAction={() => setShowModal(true)} />}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Distribute Exam Paper</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select label="Exam Paper" value={form.exam_paper_id} onChange={(e) => setForm({ ...form, exam_paper_id: e.target.value })} options={papers?.map((p) => ({ value: p.id, label: p.title })) || []} required />
            <Select label="Classroom" value={form.classroom_id} onChange={(e) => setForm({ ...form, classroom_id: e.target.value })} options={classrooms?.map((c) => ({ value: c.id, label: c.name })) || []} required />
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="submit" loading={createMutation.isPending}>Distribute</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
