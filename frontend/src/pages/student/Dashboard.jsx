import React, { useEffect, useState } from 'react';
import { TrendingUp, CheckCircle, Award, BookOpen } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import api from '../../api/client';

export default function Dashboard() {
  const { user } = useAuthStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/dashboard/student');
        setData(response.data);
      } catch (error) {
        console.error('Failed to fetch student dashboard', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = [
    {
      label: 'Overall Average',
      value: data?.overall_average ?? '--',
      icon: TrendingUp,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      label: 'Attendance %',
      value: data?.attendance_percentage != null ? `${data.attendance_percentage}%` : '--',
      icon: CheckCircle,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    },
    {
      label: 'Class Position',
      value: data?.class_position ?? '--',
      icon: Award,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
    },
    {
      label: 'Total Subjects',
      value: data?.total_subjects ?? '--',
      icon: BookOpen,
      color: 'text-orange-600',
      bg: 'bg-orange-100',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gray-200 rounded-full animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                  <div className="h-7 w-16 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {user?.first_name || 'Student'}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Admission No: {user?.admission_no || '--'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4 hover:shadow-md transition-shadow"
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Marks */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Marks</h2>
        {data?.recent_marks?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="pb-3 font-medium">Subject</th>
                  <th className="pb-3 font-medium">Assessment</th>
                  <th className="pb-3 font-medium">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.recent_marks.slice(0, 5).map((mark, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="py-3 text-gray-900 font-medium">{mark.subject || '--'}</td>
                    <td className="py-3 text-gray-600">{mark.assessment || '--'}</td>
                    <td className="py-3 text-gray-900 font-semibold">{mark.score ?? '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-sm italic">No recent marks available.</p>
        )}
      </div>
    </div>
  );
}
