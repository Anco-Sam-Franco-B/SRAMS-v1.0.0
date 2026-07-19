import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import useAuthStore from '../../store/authStore';
import {
  Users, GraduationCap, BookOpen, Bell, Calendar,
  TrendingUp, FileText, BarChart3, Target, Send
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuthStore();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/dashboard/admin').then((r) => r.data.data),
  });

  const { data: academicYears } = useQuery({
    queryKey: ['academic-years'],
    queryFn: () => api.get('/academic-years').then((r) => r.data.data),
  });

  const { data: terms } = useQuery({
    queryKey: ['terms'],
    queryFn: () => api.get('/terms').then((r) => r.data.data),
  });

  const stats = dashboardData?.stats || {};
  const recentActivity = dashboardData?.recentActivity || {};
  const currentYear = academicYears?.find((y) => y.is_current);
  const currentTerm = terms?.find((t) => t.is_current);

  const statCards = [
    { label: 'Students', value: stats.students || 0, icon: Users, color: 'bg-blue-500/10 text-blue-600' },
    { label: 'Teachers', value: stats.teachers || 0, icon: GraduationCap, color: 'bg-emerald-500/10 text-emerald-600' },
    { label: 'Classes', value: stats.classes || 0, icon: BookOpen, color: 'bg-amber-500/10 text-amber-600' },
    { label: 'Subjects', value: stats.subjects || 0, icon: FileText, color: 'bg-purple-500/10 text-purple-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back, {user?.first_name || 'Admin'}</h1>
          <p className="text-sm text-muted-foreground/70 mt-1">Here's what's happening at your school today</p>
        </div>
        <div className="flex items-center gap-2">
          {currentYear && <Badge variant="info">{currentYear.name}</Badge>}
          {currentTerm && <Badge variant="success">{currentTerm.name}</Badge>}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <Card key={i} hover className="p-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground/70">{stat.label}</p>
                <p className="text-2xl font-bold tracking-tight">{isLoading ? '...' : stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: '/admin/students', icon: Users, label: 'Add Student' },
            { href: '/admin/teachers', icon: GraduationCap, label: 'Add Teacher' },
            { href: '/admin/attendance', icon: Calendar, label: 'Attendance' },
            { href: '/admin/exam-papers', icon: FileText, label: 'Exam Papers' },
            { href: '/admin/report-cards', icon: BarChart3, label: 'Report Cards' },
            { href: '/admin/curriculum', icon: BookOpen, label: 'Curriculum' },
            { href: '/admin/imihigo', icon: Target, label: 'Imihigo' },
            { href: '/admin/submissions', icon: Send, label: 'Submissions' },
          ].map((item, i) => (
            <a key={i} href={item.href} className="flex items-center gap-3 p-3 rounded-xl border border-border/30 hover:bg-accent/30 transition-all">
              <item.icon className="h-5 w-5 text-primary/70" />
              <span className="text-sm font-medium text-foreground/80">{item.label}</span>
            </a>
          ))}
        </div>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Students</h2>
            <a href="/admin/students" className="text-sm text-primary hover:underline">View all</a>
          </div>
          {recentActivity.students?.length > 0 ? (
            <div className="space-y-2">
              {recentActivity.students.map((s) => (
                <div key={s.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-accent/30 transition-colors">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-medium">
                    {s.first_name?.[0]}{s.last_name?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{s.first_name} {s.last_name}</p>
                    <p className="text-xs text-muted-foreground/60">{s.admission_no}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-muted-foreground/50 text-center py-4">No recent students</p>}
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Teachers</h2>
            <a href="/admin/teachers" className="text-sm text-primary hover:underline">View all</a>
          </div>
          {recentActivity.teachers?.length > 0 ? (
            <div className="space-y-2">
              {recentActivity.teachers.map((t) => (
                <div key={t.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-accent/30 transition-colors">
                  <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center text-success text-xs font-medium">
                    {t.first_name?.[0]}{t.last_name?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t.first_name} {t.last_name}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-muted-foreground/50 text-center py-4">No recent teachers</p>}
        </Card>
      </div>

      {/* System Info */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">System Information</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><p className="text-muted-foreground/60">School</p><p className="font-medium">APR Secondary School</p></div>
          <div><p className="text-muted-foreground/60">District</p><p className="font-medium">Nyarugenge</p></div>
          <div><p className="text-muted-foreground/60">Province</p><p className="font-medium">Kigali City</p></div>
          <div><p className="text-muted-foreground/60">Country</p><p className="font-medium">Rwanda</p></div>
        </div>
      </Card>
    </div>
  );
}
