import React, { useEffect, useState } from 'react';
import { Users, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import useAuthStore from '../../store/authStore';

export default function TeacherClasses() {
  const { user } = useAuthStore();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const res = await api.get(`/teachers/${user?.id}/assignments`);
        setAssignments(res.data.data || res.data || []);
      } catch (error) {
        toast.error('Failed to load classes');
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchAssignments();
  }, [user?.id]);

  const toggleExpand = (id) => {
    setExpanded(expanded === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Classes</h1>
        <p className="text-gray-500 text-sm">View your assigned classes and students.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-white rounded-xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No classes assigned yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((a) => (
            <div key={a.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <button
                onClick={() => toggleExpand(a.id)}
                className="w-full flex items-center justify-between p-5 hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">{a.class?.name || a.class_name || 'Class'}</p>
                    <p className="text-sm text-gray-500">
                      {a.subject?.name || a.subject_name || 'Subject'} &middot; {a.trade?.name || a.trade_name || 'Trade'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                    {a.student_count ?? a.students_count ?? 0} students
                  </span>
                  {expanded === a.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>

              {expanded === a.id && (
                <div className="border-t border-gray-100 p-5">
                  {a.students && a.students.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <th className="px-3 py-2">Name</th>
                            <th className="px-3 py-2">Admission No</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {a.students.map((s) => (
                            <tr key={s.id} className="hover:bg-gray-50/50">
                              <td className="px-3 py-2 text-sm text-gray-900">{s.first_name} {s.last_name}</td>
                              <td className="px-3 py-2 text-sm text-gray-500">{s.admission_no}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No students in this class.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
