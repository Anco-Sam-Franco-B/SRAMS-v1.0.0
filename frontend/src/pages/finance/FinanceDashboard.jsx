import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import Card from '../../components/ui/Card';
import { DollarSign, TrendingUp, AlertCircle, Users } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function FinanceDashboard() {
  const { data: summary } = useQuery({
    queryKey: ['finance', 'summary'],
    queryFn: () => api.get('/finance/summary').then((r) => r.data.data),
  });

  const stats = [
    { label: 'Total Expected', value: summary?.total_expected ? `RWF ${Number(summary.total_expected).toLocaleString()}` : 'RWF 0', icon: DollarSign, color: 'bg-brand-600' },
    { label: 'Total Collected', value: summary?.total_collected ? `RWF ${Number(summary.total_collected).toLocaleString()}` : 'RWF 0', icon: TrendingUp, color: 'bg-emerald-600' },
    { label: 'Total Pending', value: summary?.total_pending ? `RWF ${Number(summary.total_pending).toLocaleString()}` : 'RWF 0', icon: AlertCircle, color: 'bg-amber-600' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-surface-100">Finance Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <Card key={i} hover>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${s.color}`}><s.icon className="w-6 h-6 text-white" /></div>
              <div><p className="text-sm text-gray-500">{s.label}</p><p className="text-xl font-bold text-gray-900 dark:text-surface-100">{s.value}</p></div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
