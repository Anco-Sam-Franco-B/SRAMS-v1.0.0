import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/Dialog';
import Badge from '../../components/ui/Badge';
import SearchInput from '../../components/ui/SearchInput';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, FileText, Clock, CheckCircle } from 'lucide-react';

export default function ExamPapers() {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ exam_type: 'continuous', title: '', subject_id: '', class_id: '', term_id: '', total_marks: '100', duration_minutes: '' });
  const queryClient = useQueryClient();

  const { data: papers } = useQuery({
    queryKey: ['exam-papers', search],
    queryFn: () => api.get('/exam-papers').then((r) => r.data.data),
  });

  const { data: subjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => api.get('/subjects').then((r) => r.data.data),
  });

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: () => api.get('/classes').then((r) => r.data.data),
  });

  const { data: terms } = useQuery({
    queryKey: ['terms'],
    queryFn: () => api.get('/terms').then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/exam-papers', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['exam-papers']);
      setShowModal(false);
      setEditItem(null);
      toast.success('Exam paper created');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => api.put(`/exam-papers/${editItem.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['exam-papers']);
      setShowModal(false);
      setEditItem(null);
      toast.success('Exam paper updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/exam-papers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['exam-papers']);
      toast.success('Exam paper deleted');
    },
  });

  const openEdit = (paper) => {
    setEditItem(paper);
    setForm({
      title: paper.title,
      exam_type: paper.exam_type,
      subject_id: paper.subject_id || '',
      class_id: paper.class_id || '',
      term_id: paper.term_id || '',
      total_marks: String(paper.total_marks || 100),
      duration_minutes: String(paper.duration_minutes || ''),
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...form, total_marks: Number(form.total_marks), duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null };
    editItem ? updateMutation.mutate(data) : createMutation.mutate(data);
  };

  const statusColors = { draft: 'secondary', published: 'info', distributed: 'success', completed: 'default' };
  const typeLabels = { mock: 'Mock Exam', practical: 'Practical', national: 'National Exam', continuous: 'Continuous Assessment' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Exam Papers</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage exam papers and distribution</p>
        </div>
        <Button onClick={() => { setEditItem(null); setForm({ title: '', exam_type: 'mock', subject_id: '', class_id: '', term_id: '', total_marks: '100', duration_minutes: '' }); setShowModal(true); }}>
          <Plus className="h-4 w-4" /> Add Exam Paper
        </Button>
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="Search exam papers..." className="max-w-sm" />

      {papers && papers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {papers.map((p) => (
            <Card key={p.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{p.title}</h3>
                    <p className="text-sm text-muted-foreground">{typeLabels[p.exam_type] || p.exam_type}</p>
                  </div>
                </div>
                <Badge variant={statusColors[p.status] || 'secondary'}>{p.status}</Badge>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                {p.subject_name && <p className="text-muted-foreground">Subject: {p.subject_name}</p>}
                {p.class_name && <p className="text-muted-foreground">Class: {p.class_name}</p>}
                {p.term_name && <p className="text-muted-foreground">Term: {p.term_name}</p>}
                <div className="flex items-center gap-4 pt-2">
                  <span className="text-muted-foreground">Marks: {p.total_marks}</span>
                  {p.duration_minutes && <span className="text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {p.duration_minutes}min</span>}
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t">
                <Button variant="ghost" size="sm" onClick={() => openEdit(p)}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="No exam papers" description="Create exam papers to get started" action="Add Exam Paper" onAction={() => setShowModal(true)} />
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Exam Paper' : 'Add Exam Paper'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <Select label="Exam Type" value={form.exam_type} onChange={(e) => setForm({ ...form, exam_type: e.target.value })} options={[
              { value: 'mock', label: 'Mock Exam' },
              { value: 'practical', label: 'Practical' },
              { value: 'national', label: 'National Exam' },
              { value: 'continuous', label: 'Continuous Assessment' },
            ]} />
            <Select label="Subject" value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })} options={subjects?.map((s) => ({ value: s.id, label: s.name })) || []} />
            <Select label="Class" value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })} options={classes?.map((c) => ({ value: c.id, label: c.name })) || []} />
            <Select label="Term" value={form.term_id} onChange={(e) => setForm({ ...form, term_id: e.target.value })} options={terms?.map((t) => ({ value: t.id, label: t.name })) || []} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Total Marks" type="number" value={form.total_marks} onChange={(e) => setForm({ ...form, total_marks: e.target.value })} />
              <Input label="Duration (minutes)" type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} />
            </div>
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
