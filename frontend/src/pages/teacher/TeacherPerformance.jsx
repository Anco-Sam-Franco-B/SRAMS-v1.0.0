import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { TrendingUp, Users, Award } from 'lucide-react';

export default function TeacherPerformance() {
  const { data: performances } = useQuery({ queryKey: ['teacher-performance'], queryFn: () => api.get('/teacher-performance').then((r) => r.data.data) });

  const ratingColors = { excellent: 'success', good: 'info', satisfactory: 'warning', needs_improvement: 'destructive' };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Teacher Performance</h1><p className="text-sm text-muted-foreground mt-1">Track and review teacher performance metrics</p></div>
      {performances && performances.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {performances.map((p) => (
            <Card key={p.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg"><Users className="h-5 w-5 text-primary" /></div>
                  <div><h3 className="font-semibold">{p.first_name} {p.last_name}</h3><p className="text-sm text-muted-foreground">{p.employee_no}</p></div>
                </div>
                {p.rating && <Badge variant={ratingColors[p.rating] || 'secondary'}>{p.rating}</Badge>}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div><p className="text-xs text-muted-foreground">Avg Marks</p><p className="text-lg font-bold">{p.avg_student_marks ? Number(p.avg_student_marks).toFixed(1) : '-'}</p></div>
                <div><p className="text-xs text-muted-foreground">Attendance</p><p className="text-lg font-bold">{p.attendance_rate ? `${Number(p.attendance_rate).toFixed(0)}%` : '-'}</p></div>
                <div><p className="text-xs text-muted-foreground">Completion</p><p className="text-lg font-bold">{p.completion_rate ? `${Number(p.completion_rate).toFixed(0)}%` : '-'}</p></div>
              </div>
            </Card>
          ))}
        </div>
      ) : <EmptyState title="No performance data" description="Performance records will appear here" />}
    </div>
  );
}
