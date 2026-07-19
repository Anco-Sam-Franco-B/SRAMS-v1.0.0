import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, BookOpen, ClipboardCheck, GraduationCap,
  CheckSquare, BarChart3, Activity
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import useAuthStore from '../../store/authStore';

export default function TeacherDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/dashboard/teacher');
        setStats(res.data);
      } catch (error) {
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const statCards = [
    { label: 'My Classes', value: stats?.classes_count ?? 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'My Subjects', value: stats?.subjects_count ?? 0, icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Pending Attendance', value: stats?.pending_attendance ?? 0, icon: ClipboardCheck, color: 'text-orange-600', bg: 'bg-orange-100' },
    { label: 'Total Students', value: stats?.total_students ?? 0, icon: GraduationCap, color: 'text-purple-600', bg: 'bg-purple-100' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold">
          Welcome, {user?.first_name || 'Teacher'}!
        </h1>
        <p className="text-blue-100 mt-1">Here's your teaching overview for today.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? (
                  <span className="inline-block w-8 h-6 bg-gray-200 rounded animate-pulse" />
                ) : (
                  stat.value
                )}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              to="/teacher/attendance"
              className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-sm transition-colors"
            >
              <CheckSquare className="w-5 h-5" />
              Mark Attendance
            </Link>
            <Link
              to="/teacher/marks"
              className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium text-sm transition-colors"
            >
              <BarChart3 className="w-5 h-5" />
              Enter Marks
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : stats?.recent_activity?.length > 0 ? (
            <div className="space-y-3">
              {stats.recent_activity.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </div>
                  <p className="text-sm text-gray-700">{item.description || item}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm italic">No recent activity yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
