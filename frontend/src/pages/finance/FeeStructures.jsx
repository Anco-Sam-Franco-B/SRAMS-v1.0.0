import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';

export default function FeeStructures() {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ class_id: '', academic_year_id: '', fee_type: '', amount: '', description: '' });
  const queryClient = useQueryClient();

  const { data: structures } = useQuery({
    queryKey: ['fee-structures'],
    queryFn: () => api.get('/finance/fee-structures').then((r) => r.data.data),
  });

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: () => api.get('/classes').then((r) => r.data.data),
  });

  const { data: years } = useQuery({
    queryKey: ['academic-years'],
    queryFn: () => api.get('/academic-years').then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/finance/fee-structures', data),
    onSuccess: () => { queryClient.invalidateQueries(['fee-structures']); setShowModal(false); toast.success('Fee structure created'); },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({ ...form, amount: Number(form.amount) });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-surface-100">Fee Structures</h1>
        <Button onClick={() => setShowModal(true)}>Add Fee Structure</Button>
      </div>
      {structures && structures.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {structures.map((s) => (
            <Card key={s.id} hover>
              <h3 className="font-semibold text-gray-900 dark:text-surface-100">{s.fee_type}</h3>
              <p className="text-sm text-gray-500 mt-1">{s.class_name} - {s.year_name}</p>
              <p className="text-2xl font-bold text-brand-600 mt-3">RWF {Number(s.amount).toLocaleString()}</p>
              {s.description && <p className="text-xs text-gray-400 mt-2">{s.description}</p>}
            </Card>
          ))}
        </div>
      ) : <EmptyState title="No fee structures" description="Create fee structures for your classes" action="Add Fee Structure" onAction={() => setShowModal(true)} />}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Fee Structure" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select label="Class" value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })} options={classes?.map((c) => ({ value: c.id, label: c.name })) || []} required />
          <Select label="Academic Year" value={form.academic_year_id} onChange={(e) => setForm({ ...form, academic_year_id: e.target.value })} options={years?.map((y) => ({ value: y.id, label: y.name })) || []} required />
          <Input label="Fee Type" value={form.fee_type} onChange={(e) => setForm({ ...form, fee_type: e.target.value })} placeholder="e.g., Tuition, Exam, Lab" required />
          <Input label="Amount (RWF)" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending}>Create</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
