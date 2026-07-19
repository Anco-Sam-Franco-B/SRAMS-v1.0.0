import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import Card from '../../components/ui/Card';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import { Users, BarChart3, CheckSquare, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ParentDashboard() {
  const navigate = useNavigate();
  const { data: children } = useQuery({ queryKey: ['parent-children'], queryFn: () => api.get('/parents/children').then((r) => r.data.data) });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-surface-100">Welcome to Parent Portal</h1>
        <p className="text-sm text-gray-500 dark:text-surface-400 mt-1">Monitor your children's academic progress</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'My Children', value: children?.length || 0, icon: Users, color: 'bg-brand-600', to: '/parent/children' },
          { label: 'Marks', icon: BarChart3, color: 'bg-emerald-600', to: '/parent/marks' },
          { label: 'Attendance', icon: CheckSquare, color: 'bg-amber-600', to: '/parent/attendance' },
          { label: 'Report Cards', icon: FileText, color: 'bg-purple-600', to: '/parent/report-cards' },
        ].map((s, i) => (
          <Card key={i} hover className="cursor-pointer" onClick={() => navigate(s.to)}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${s.color}`}><s.icon className="w-6 h-6 text-white" /></div>
              <div><p className="text-sm text-gray-500">{s.label}</p><p className="text-2xl font-bold text-gray-900 dark:text-surface-100">{s.value ?? '-'}</p></div>
            </div>
          </Card>
        ))}
      </div>
      {children && children.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-surface-100">My Children</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {children.map((c) => (
              <Card key={c.id} hover>
                <div className="flex items-center gap-4">
                  <Avatar name={`${c.first_name} ${c.last_name}`} size="lg" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-surface-100">{c.first_name} {c.last_name}</h3>
                    <p className="text-sm text-gray-500">{c.admission_no}</p>
                    <p className="text-sm text-gray-400">{c.class_name} - {c.trade_name}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
