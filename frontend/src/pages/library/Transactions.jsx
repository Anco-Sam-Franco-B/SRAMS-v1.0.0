import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';

export default function LibraryTransactions() {
  const queryClient = useQueryClient();
  const { data: transactions } = useQuery({ queryKey: ['library-transactions'], queryFn: () => api.get('/library/transactions').then((r) => r.data.data) });

  const returnMutation = useMutation({
    mutationFn: (id) => api.post(`/library/return/${id}`),
    onSuccess: () => { queryClient.invalidateQueries(['library-transactions']); toast.success('Book returned'); },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-surface-100">Library Transactions</h1>
      <Card>
        {transactions && transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-500 dark:text-surface-400 border-b border-surface-100 dark:border-surface-800">
                <th className="pb-3 font-medium">Book</th>
                <th className="pb-3 font-medium">Student</th>
                <th className="pb-3 font-medium">Borrowed</th>
                <th className="pb-3 font-medium">Due</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Action</th>
              </tr></thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                {transactions.map((t) => (
                  <tr key={t.id} className="text-gray-700 dark:text-surface-300">
                    <td className="py-3 font-medium">{t.book_title}</td>
                    <td className="py-3">{t.first_name} {t.last_name}</td>
                    <td className="py-3">{new Date(t.borrow_date).toLocaleDateString()}</td>
                    <td className="py-3">{new Date(t.due_date).toLocaleDateString()}</td>
                    <td className="py-3"><Badge variant={t.status === 'returned' ? 'success' : t.status === 'overdue' ? 'danger' : 'warning'}>{t.status}</Badge></td>
                    <td className="py-3">{t.status === 'borrowed' && <Button size="sm" variant="outline" onClick={() => returnMutation.mutate(t.id)} loading={returnMutation.isPending}>Return</Button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState title="No transactions" description="No library transactions yet" />}
      </Card>
    </div>
  );
}
