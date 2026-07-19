import React, { useEffect, useState } from 'react';
import useAuthStore from '../../store/authStore';
import api from '../../api/client';

const gradeColor = (grade) => {
  const g = (grade || '').toUpperCase();
  if (g === 'A') return 'bg-emerald-100 text-emerald-700';
  if (g === 'B') return 'bg-blue-100 text-blue-700';
  if (g === 'C') return 'bg-yellow-100 text-yellow-700';
  if (g === 'D') return 'bg-orange-100 text-orange-700';
  return 'bg-red-100 text-red-700';
};

export default function StudentMarks() {
  const { user } = useAuthStore();
  const [marks, setMarks] = useState([]);
  const [terms, setTerms] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [marksRes, termsRes] = await Promise.all([
          api.get('/marks'),
          api.get('/terms'),
        ]);
        setMarks(marksRes.data.data || []);
        setTerms(termsRes.data.data || []);
      } catch (error) {
        console.error('Failed to fetch marks', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredMarks = marks.filter((m) => {
    if (!selectedTerm) return true;
    return String(m.term_id) === String(selectedTerm);
  });

  const totalScore = filteredMarks.reduce((sum, m) => sum + (Number(m.marks_scored) || 0), 0);
  const totalMax = filteredMarks.reduce((sum, m) => sum + (Number(m.total_marks) || 0), 0);
  const avg = filteredMarks.length > 0 ? (totalScore / filteredMarks.length).toFixed(1) : '--';

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
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
        <h1 className="text-2xl font-bold text-gray-900">My Marks</h1>
        <p className="text-gray-500 text-sm">View your assessment scores and grades.</p>
      </div>

      {/* Term Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <label className="text-sm font-medium text-gray-700">Filter by Term:</label>
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="">All Terms</option>
            {terms.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name || t.term_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Marks Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="pb-3 font-medium">Assessment Title</th>
                <th className="pb-3 font-medium">Subject</th>
                <th className="pb-3 font-medium text-center">Marks Scored</th>
                <th className="pb-3 font-medium text-center">Total Marks</th>
                <th className="pb-3 font-medium text-center">Percentage</th>
                <th className="pb-3 font-medium text-center">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredMarks.length > 0 ? (
                filteredMarks.map((mark, i) => {
                  const pct = mark.total_marks
                    ? ((mark.marks_scored / mark.total_marks) * 100).toFixed(1)
                    : '--';
                  return (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="py-3 text-gray-900 font-medium">
                        {mark.assessment_title || mark.title || '--'}
                      </td>
                      <td className="py-3 text-gray-600">{mark.subject || '--'}</td>
                      <td className="py-3 text-center text-gray-900">{mark.marks_scored ?? '--'}</td>
                      <td className="py-3 text-center text-gray-600">{mark.total_marks ?? '--'}</td>
                      <td className="py-3 text-center text-gray-600">{pct}%</td>
                      <td className="py-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${gradeColor(mark.grade)}`}>
                          {mark.grade || '--'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-500 italic">
                    No marks available for this selection.
                  </td>
                </tr>
              )}
            </tbody>
            {filteredMarks.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-gray-200 font-semibold text-gray-900">
                  <td className="py-3" colSpan="2">Summary</td>
                  <td className="py-3 text-center">{totalScore}</td>
                  <td className="py-3 text-center">{totalMax}</td>
                  <td className="py-3 text-center">
                    {totalMax > 0 ? ((totalScore / totalMax) * 100).toFixed(1) : '--'}%
                  </td>
                  <td className="py-3 text-center">Avg: {avg}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
