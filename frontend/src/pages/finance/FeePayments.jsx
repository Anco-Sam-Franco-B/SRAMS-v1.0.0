import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import SearchInput from '../../components/ui/SearchInput';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';

export default function FeePayments() {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ student_id: '', fee_structure_id: '', amount_paid: '', payment_method: 'cash' });
  const queryClient = useQueryClient();

  const { data: payments } = useQuery({
    queryKey: ['fee-payments', search],
    queryFn: () => api.get('/finance/payments').then((r) => r.data.data),
  });

  const { data: structures } = useQuery({
    queryKey: ['fee-structures'],
    queryFn: () => api.get('/finance/fee-structures').then((r) => r.data.data),
  });

  const { data: students } = useQuery({
    queryKey: ['students'],
    queryFn: () => api.get('/students').then((r) => r.data.data),
  });

  const recordMutation = useMutation({
    mutationFn: (data) => api.post('/finance/payments', data),
    onSuccess: () => { queryClient.invalidateQueries(['fee-payments']); setShowModal(false); toast.success('Payment recorded'); },
    onError: (err) => toast.error(err?.response?.data?.error || 'Failed'),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-surface-100">Fee Payments</h1>
        <Button onClick={() => setShowModal(true)}>Record Payment</Button>
      </div>
      <SearchInput value={search} onChange={setSearch} placeholder="Search payments..." className="max-w-sm" />
      <Card>
        {payments && payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-500 dark:text-surface-400 border-b border-surface-100 dark:border-surface-800">
                <th className="pb-3 font-medium">Student</th>
                <th className="pb-3 font-medium">Fee Type</th>
                <th className="pb-3 font-medium">Amount</th>
                <th className="pb-3 font-medium">Method</th>
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Receipt</th>
              </tr></thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                {payments.map((p) => (
                  <tr key={p.id} className="text-gray-700 dark:text-surface-300">
                    <td className="py-3">{p.first_name} {p.last_name}</td>
                    <td className="py-3"><Badge variant="info">{p.fee_type}</Badge></td>
                    <td className="py-3 font-medium">RWF {Number(p.amount_paid).toLocaleString()}</td>
                    <td className="py-3 capitalize">{p.payment_method}</td>
                    <td className="py-3">{new Date(p.payment_date).toLocaleDateString()}</td>
                    <td className="py-3 text-xs text-gray-500">{p.receipt_number || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState title="No payments recorded" description="Record fee payments here" action="Record Payment" onAction={() => setShowModal(true)} />}
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Record Payment">
        <form onSubmit={(e) => { e.preventDefault(); recordMutation.mutate({ ...form, amount_paid: Number(form.amount_paid) }); }} className="space-y-4">
          <Select label="Student" value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} options={students?.map((s) => ({ value: s.id, label: `${s.first_name} ${s.last_name} (${s.admission_no})` })) || []} required />
          <Select label="Fee Structure" value={form.fee_structure_id} onChange={(e) => setForm({ ...form, fee_structure_id: e.target.value })} options={structures?.map((s) => ({ value: s.id, label: `${s.fee_type} - RWF ${s.amount}` })) || []} required />
          <Input label="Amount Paid (RWF)" type="number" value={form.amount_paid} onChange={(e) => setForm({ ...form, amount_paid: e.target.value })} required />
          <Select label="Payment Method" value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} options={[{ value: 'cash', label: 'Cash' }, { value: 'bank', label: 'Bank Transfer' }, { value: 'mobile', label: 'Mobile Money' }, { value: 'online', label: 'Online' }]} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={recordMutation.isPending}>Record</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
