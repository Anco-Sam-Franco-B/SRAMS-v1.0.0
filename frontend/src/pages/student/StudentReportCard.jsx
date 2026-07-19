import React, { useEffect, useState } from 'react';
import useAuthStore from '../../store/authStore';
import api from '../../api/client';
import toast from 'react-hot-toast';

const gradeColor = (grade) => {
  const g = (grade || '').toUpperCase();
  if (g === 'A') return 'text-emerald-600';
  if (g === 'B') return 'text-blue-600';
  if (g === 'C') return 'text-yellow-600';
  if (g === 'D') return 'text-orange-600';
  return 'text-red-600';
};

export default function StudentReportCard() {
  const { user } = useAuthStore();
  const [reportCards, setReportCards] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [terms, setTerms] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rcRes, termsRes] = await Promise.all([
          api.get(`/report-cards?student_id=${user?.studentId || user?.id}`),
          api.get('/terms'),
        ]);
        setReportCards(rcRes.data.data || []);
        setTerms(termsRes.data.data || []);
      } catch (error) {
        console.error('Failed to fetch report cards', error);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchData();
  }, [user]);

  const filteredCards = reportCards.filter((rc) => {
    if (!selectedTerm) return true;
    return String(rc.term_id) === String(selectedTerm);
  });

  useEffect(() => {
    if (!selectedId) {
      setSelectedReport(null);
      return;
    }
    const fetchReport = async () => {
      setLoadingReport(true);
      try {
        const res = await api.get(`/report-cards/${selectedId}`);
        setSelectedReport(res.data.report_card || res.data);
      } catch (error) {
        console.error('Failed to fetch report card', error);
        toast.error('Failed to load report card');
      } finally {
        setLoadingReport(false);
      }
    };
    fetchReport();
  }, [selectedId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Report Cards</h1>
        <p className="text-gray-500 text-sm">View and download your academic report cards.</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Select Term:</label>
            <select
              value={selectedTerm}
              onChange={(e) => { setSelectedTerm(e.target.value); setSelectedId(''); }}
              className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">All Terms</option>
              {terms.map((t) => (
                <option key={t.id} value={t.id}>{t.name || t.term_name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Select Report:</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">Choose a report card</option>
              {filteredCards.map((rc) => (
                <option key={rc.id} value={rc.id}>
                  {rc.term_name || rc.term || `Term ${rc.term_id}`} - {rc.academic_year || ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Report Card Preview */}
      {loadingReport && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </div>
      )}

      {selectedReport && !loadingReport && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8" id="report-card">
          {/* Header */}
          <div className="text-center border-b border-gray-200 pb-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900">SRAMS</h2>
            <p className="text-sm text-gray-500">Student Records & Academic Management System</p>
          </div>

          {/* Student Info */}
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div>
              <p className="text-gray-500">Name</p>
              <p className="font-medium text-gray-900">
                {selectedReport.student_name || `${user?.first_name || ''} ${user?.last_name || ''}`}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Admission No</p>
              <p className="font-medium text-gray-900">{selectedReport.admission_no || user?.admission_no || '--'}</p>
            </div>
            <div>
              <p className="text-gray-500">Class</p>
              <p className="font-medium text-gray-900">{selectedReport.class_name || user?.class_name || '--'}</p>
            </div>
            <div>
              <p className="text-gray-500">Trade</p>
              <p className="font-medium text-gray-900">{selectedReport.trade || user?.trade || '--'}</p>
            </div>
            <div>
              <p className="text-gray-500">Term</p>
              <p className="font-medium text-gray-900">{selectedReport.term_name || '--'}</p>
            </div>
            <div>
              <p className="text-gray-500">Academic Year</p>
              <p className="font-medium text-gray-900">{selectedReport.academic_year || '--'}</p>
            </div>
          </div>

          {/* Marks Table */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm border border-gray-200">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-600">
                  <th className="p-3 border border-gray-200 font-medium">Subject</th>
                  <th className="p-3 border border-gray-200 font-medium text-center">CA</th>
                  <th className="p-3 border border-gray-200 font-medium text-center">Exam</th>
                  <th className="p-3 border border-gray-200 font-medium text-center">Total</th>
                  <th className="p-3 border border-gray-200 font-medium text-center">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(selectedReport.marks || selectedReport.subjects || []).map((m, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="p-3 border border-gray-200 text-gray-900 font-medium">{m.subject || '--'}</td>
                    <td className="p-3 border border-gray-200 text-center text-gray-600">{m.ca ?? m.ca_marks ?? '--'}</td>
                    <td className="p-3 border border-gray-200 text-center text-gray-600">{m.exam ?? m.exam_marks ?? '--'}</td>
                    <td className="p-3 border border-gray-200 text-center text-gray-900 font-semibold">
                      {m.total ?? ((Number(m.ca ?? m.ca_marks) || 0) + (Number(m.exam ?? m.exam_marks) || 0))}
                    </td>
                    <td className="p-3 border border-gray-200 text-center">
                      <span className={`font-semibold ${gradeColor(m.grade)}`}>{m.grade || '--'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="font-bold text-gray-900">{selectedReport.total ?? '--'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Average</p>
              <p className="font-bold text-gray-900">{selectedReport.average?.toFixed?.(1) ?? selectedReport.average ?? '--'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Position</p>
              <p className="font-bold text-gray-900">{selectedReport.position || selectedReport.class_position || '--'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Overall Grade</p>
              <p className={`font-bold ${gradeColor(selectedReport.overall_grade || selectedReport.grade)}`}>
                {selectedReport.overall_grade || selectedReport.grade || '--'}
              </p>
            </div>
          </div>

          {/* Teacher Comment */}
          <div className="mb-6 p-4 border border-gray-200 rounded-xl">
            <p className="text-sm font-medium text-gray-700 mb-1">Teacher Comment</p>
            <p className="text-sm text-gray-600">{selectedReport.teacher_comment || selectedReport.comment || 'No comment available.'}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => toast('Coming soon')}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Print Report
            </button>
            <button
              onClick={() => toast('Coming soon')}
              className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Download PDF
            </button>
          </div>
        </div>
      )}

      {!selectedId && !loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
          <p className="text-gray-500 italic">Select a report card above to view it.</p>
        </div>
      )}
    </div>
  );
}
