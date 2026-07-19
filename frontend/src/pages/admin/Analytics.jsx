import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import Card from '../../components/ui/Card';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { TrendingUp, Users, BookOpen, Award } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

export default function Analytics() {
  const [termId, setTermId] = useState('');

  const { data: performance } = useQuery({
    queryKey: ['analytics', 'performance', termId],
    queryFn: () => api.get(`/analytics/performance${termId ? `?term_id=${termId}` : ''}`).then((r) => r.data.data),
  });

  const { data: subjects } = useQuery({
    queryKey: ['analytics', 'subjects'],
    queryFn: () => api.get('/analytics/subject-analysis').then((r) => r.data.data),
  });

  const { data: teachers } = useQuery({
    queryKey: ['analytics', 'teachers'],
    queryFn: () => api.get('/analytics/teacher-performance').then((r) => r.data.data),
  });

  const subjectChartData = subjects ? {
    labels: subjects.map((s) => s.subject_name),
    datasets: [{
      label: 'Average Marks',
      data: subjects.map((s) => Number(s.avg_marks)),
      backgroundColor: 'rgba(59, 130, 246, 0.5)',
      borderColor: 'rgb(59, 130, 246)',
      borderWidth: 2,
    }],
  } : null;

  const passRateData = subjects ? {
    labels: subjects.map((s) => s.subject_name),
    datasets: [{
      label: 'Pass Rate %',
      data: subjects.map((s) => Number(s.pass_rate) || 0),
      backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
    }],
  } : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-surface-100">Analytics Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-surface-400 mt-1">Performance insights and trends</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card header={<h3 className="font-semibold text-gray-900 dark:text-surface-100 flex items-center gap-2"><BookOpen className="w-5 h-5 text-brand-600" /> Subject Performance</h3>}>
          {subjectChartData ? (
            <div className="h-64"><Bar data={subjectChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} /></div>
          ) : <p className="text-gray-400 text-center py-8">No data available</p>}
        </Card>

        <Card header={<h3 className="font-semibold text-gray-900 dark:text-surface-100 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-emerald-600" /> Pass Rate by Subject</h3>}>
          {passRateData ? (
            <div className="h-64"><Doughnut data={passRateData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }} /></div>
          ) : <p className="text-gray-400 text-center py-8">No data available</p>}
        </Card>
      </div>

      <Card header={<h3 className="font-semibold text-gray-900 dark:text-surface-100 flex items-center gap-2"><Users className="w-5 h-5 text-purple-600" /> Teacher Performance</h3>}>
        {teachers && teachers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-surface-400 border-b border-surface-100 dark:border-surface-800">
                  <th className="pb-3 font-medium">Teacher</th>
                  <th className="pb-3 font-medium">Trade</th>
                  <th className="pb-3 font-medium">Avg Student Marks</th>
                  <th className="pb-3 font-medium">Subjects</th>
                  <th className="pb-3 font-medium">Classes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                {teachers.map((t, i) => (
                  <tr key={i} className="text-gray-700 dark:text-surface-300">
                    <td className="py-3 font-medium">{t.teacher_name}</td>
                    <td className="py-3">{t.trade_name}</td>
                    <td className="py-3">
                      <span className={`font-medium ${Number(t.avg_student_marks) >= 50 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {t.avg_student_marks ? Number(t.avg_student_marks).toFixed(1) : 'N/A'}%
                      </span>
                    </td>
                    <td className="py-3">{t.subjects_taught}</td>
                    <td className="py-3">{t.classes_taught}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-gray-400 text-center py-8">No teacher data available</p>}
      </Card>
    </div>
  );
}
