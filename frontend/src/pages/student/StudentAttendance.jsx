import React, { useEffect, useState } from 'react';
import useAuthStore from '../../store/authStore';
import api from '../../api/client';

const statusBadge = (status) => {
  const s = (status || '').toUpperCase();
  const map = {
    PRESENT: 'bg-emerald-100 text-emerald-700',
    ABSENT: 'bg-red-100 text-red-700',
    LATE: 'bg-yellow-100 text-yellow-700',
    EXCUSED: 'bg-blue-100 text-blue-700',
    SICK: 'bg-gray-100 text-gray-600',
  };
  return map[s] || 'bg-gray-100 text-gray-600';
};

export default function StudentAttendance() {
  const { user } = useAuthStore();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get(`/attendance?student_id=${user?.studentId || user?.id}`);
        setRecords(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch attendance', error);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchData();
  }, [user]);

  const present = records.filter((r) => (r.status || '').toUpperCase() === 'PRESENT').length;
  const absent = records.filter((r) => (r.status || '').toUpperCase() === 'ABSENT').length;
  const late = records.filter((r) => (r.status || '').toUpperCase() === 'LATE').length;
  const totalDays = records.length;
  const pct = totalDays > 0 ? ((present / totalDays) * 100).toFixed(1) : '--';

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-7 w-12 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
        <p className="text-gray-500 text-sm">Track your attendance record.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Present', value: present, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Absent', value: absent, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Late', value: late, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Total Days', value: totalDays, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Attendance %', value: `${pct}%`, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((card, i) => (
          <div key={i} className={`${card.bg} rounded-xl shadow-sm border border-gray-100 p-4`}>
            <p className="text-xs font-medium text-gray-500">{card.label}</p>
            <p className={`text-2xl font-bold ${card.color} mt-1`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Subject</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Class</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {records.length > 0 ? (
                records.map((record, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="py-3 text-gray-900">
                      {record.date ? new Date(record.date).toLocaleDateString() : '--'}
                    </td>
                    <td className="py-3 text-gray-600">{record.subject || '--'}</td>
                    <td className="py-3">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusBadge(record.status)}`}>
                        {record.status || '--'}
                      </span>
                    </td>
                    <td className="py-3 text-gray-600">{record.class_name || record.class || '--'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-gray-500 italic">
                    No attendance records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
