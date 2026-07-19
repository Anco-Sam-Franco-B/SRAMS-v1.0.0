import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import Card from '../../components/ui/Card';
import { BookOpen, AlertTriangle, Clock, CheckCircle } from 'lucide-react';

export default function LibraryDashboard() {
  const { data: books } = useQuery({ queryKey: ['library-books'], queryFn: () => api.get('/library/books').then((r) => r.data.data) });
  const { data: overdue } = useQuery({ queryKey: ['library-overdue'], queryFn: () => api.get('/library/overdue').then((r) => r.data.data) });

  const totalBooks = books?.reduce((sum, b) => sum + b.total_copies, 0) || 0;
  const available = books?.reduce((sum, b) => sum + b.available_copies, 0) || 0;

  const stats = [
    { label: 'Total Books', value: totalBooks, icon: BookOpen, color: 'bg-brand-600' },
    { label: 'Available', value: available, icon: CheckCircle, color: 'bg-emerald-600' },
    { label: 'Borrowed', value: totalBooks - available, icon: Clock, color: 'bg-amber-600' },
    { label: 'Overdue', value: overdue?.length || 0, icon: AlertTriangle, color: 'bg-red-600' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-surface-100">Library Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <Card key={i} hover>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${s.color}`}><s.icon className="w-6 h-6 text-white" /></div>
              <div><p className="text-sm text-gray-500">{s.label}</p><p className="text-2xl font-bold text-gray-900 dark:text-surface-100">{s.value}</p></div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
