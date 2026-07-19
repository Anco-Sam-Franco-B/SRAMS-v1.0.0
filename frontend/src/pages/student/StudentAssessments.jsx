import React, { useEffect, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import api from '../../api/client';

const statusBadge = (status) => {
  const s = (status || '').toLowerCase();
  if (s === 'completed') return 'bg-emerald-100 text-emerald-700';
  if (s === 'upcoming') return 'bg-blue-100 text-blue-700';
  return 'bg-gray-100 text-gray-600';
};

export default function StudentAssessments() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/assessments');
        setAssessments(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch assessments', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="space-y-3">
                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Assessments</h1>
        <p className="text-gray-500 text-sm">View upcoming and completed assessments.</p>
      </div>

      {assessments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assessments.map((a, i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900">{a.title || a.name || 'Untitled'}</h3>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusBadge(a.status)}`}>
                  {a.status || 'Unknown'}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subject</span>
                  <span className="text-gray-900 font-medium">{a.subject || '--'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date</span>
                  <span className="text-gray-900">{a.date ? new Date(a.date).toLocaleDateString() : '--'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Marks</span>
                  <span className="text-gray-900 font-medium">{a.total_marks || '--'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No assessments found.</p>
        </div>
      )}
    </div>
  );
}
