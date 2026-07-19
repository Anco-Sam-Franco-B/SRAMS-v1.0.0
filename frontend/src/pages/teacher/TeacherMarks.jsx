import React, { useEffect, useState } from 'react';
import { Save, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';

const STEPS = ['Trade', 'Academic Year', 'Term', 'Assessment'];

export default function TeacherMarks() {
  const [step, setStep] = useState(1);

  const [trades, setTrades] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [terms, setTerms] = useState([]);
  const [assessments, setAssessments] = useState([]);

  const [selectedTrade, setSelectedTrade] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedAssessment, setSelectedAssessment] = useState('');

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const currentAssessment = assessments.find((a) => a.id === selectedAssessment);

  // Load trades
  useEffect(() => {
    api.get('/trades')
      .then((res) => setTrades(res.data.data || res.data || []))
      .catch(() => toast.error('Failed to load trades'));
  }, []);

  // Load academic years
  useEffect(() => {
    if (step >= 2) {
      api.get('/academic-years')
        .then((res) => setAcademicYears(res.data.data || res.data || []))
        .catch(() => toast.error('Failed to load academic years'));
    }
  }, [step >= 2]);

  // Load terms
  useEffect(() => {
    if (selectedYear) {
      api.get(`/terms?academic_year_id=${selectedYear}`)
        .then((res) => setTerms(res.data.data || res.data || []))
        .catch(() => toast.error('Failed to load terms'));
    }
  }, [selectedYear]);

  // Load assessments
  useEffect(() => {
    if (selectedTrade && selectedTerm) {
      api.get(`/assessments?trade_id=${selectedTrade}&term_id=${selectedTerm}`)
        .then((res) => setAssessments(res.data.data || res.data || []))
        .catch(() => toast.error('Failed to load assessments'));
    }
  }, [selectedTrade, selectedTerm]);

  // Load students when assessment selected
  useEffect(() => {
    if (selectedAssessment && currentAssessment) {
      setLoading(true);
      const classId = currentAssessment.class_id || currentAssessment.class?.id;
      api.get(`/students?class_id=${classId}&trade_id=${selectedTrade}`)
        .then((res) => {
          const list = res.data.data || res.data || [];
          setStudents(list.map((s) => ({ ...s, marks: '' })));
        })
        .catch(() => toast.error('Failed to load students'))
        .finally(() => setLoading(false));
    }
  }, [selectedAssessment]);

  const handleSelect = (value, setter, nextStep) => {
    setter(value);
    // Reset downstream selections
    if (nextStep === 2) { setSelectedYear(''); setSelectedTerm(''); setSelectedAssessment(''); setStudents([]); }
    if (nextStep === 3) { setSelectedTerm(''); setSelectedAssessment(''); setStudents([]); }
    if (nextStep === 4) { setSelectedAssessment(''); setStudents([]); }
    setStep(nextStep);
  };

  const handleSelectAssessment = (value) => {
    setSelectedAssessment(value);
    setStep(4);
  };

  const updateMarks = (id, value) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, marks: value } : s))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = students
        .filter((s) => s.marks !== '' && s.marks !== undefined)
        .map((s) => ({
          student_id: s.id,
          assessment_id: selectedAssessment,
          marks: Number(s.marks),
          trade_id: selectedTrade,
        }));
      await api.post('/marks/enter', { marks: payload });
      toast.success('Marks saved successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save marks');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Enter Marks</h1>
        <p className="text-gray-500 text-sm">Select the cascade options, then enter student marks.</p>
      </div>

      {/* Steps Indicator */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between">
          {STEPS.map((s, index) => (
            <div key={index} className={`flex items-center ${index !== STEPS.length - 1 ? 'flex-1' : ''}`}>
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  step > index + 1
                    ? 'bg-green-500 text-white'
                    : step === index + 1
                    ? 'bg-blue-600 text-white ring-4 ring-blue-200'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {step > index + 1 ? <Check className="w-4 h-4" /> : index + 1}
                </div>
                <p className={`mt-2 text-xs font-medium hidden sm:block ${
                  step >= index + 1 ? 'text-blue-700' : 'text-gray-500'
                }`}>{s}</p>
              </div>
              {index !== STEPS.length - 1 && (
                <div className={`flex-1 h-1 mx-2 -mt-5 rounded-full transition-all duration-300 ${
                  step > index + 1 ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Cascade Dropdowns */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Trade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trade</label>
            <select
              value={selectedTrade}
              onChange={(e) => handleSelect(e.target.value, setSelectedTrade, 2)}
              disabled={step < 1}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            >
              <option value="">Select Trade</option>
              {trades.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Academic Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
            <select
              value={selectedYear}
              onChange={(e) => handleSelect(e.target.value, setSelectedYear, 3)}
              disabled={step < 2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            >
              <option value="">Select Year</option>
              {academicYears.map((y) => (
                <option key={y.id} value={y.id}>{y.year || y.name}</option>
              ))}
            </select>
          </div>

          {/* Term */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
            <select
              value={selectedTerm}
              onChange={(e) => handleSelect(e.target.value, setSelectedTerm, 4)}
              disabled={step < 3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            >
              <option value="">Select Term</option>
              {terms.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Assessment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assessment</label>
            <select
              value={selectedAssessment}
              onChange={(e) => handleSelectAssessment(e.target.value)}
              disabled={step < 4}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            >
              <option value="">Select Assessment</option>
              {assessments.map((a) => (
                <option key={a.id} value={a.id}>{a.title}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Assessment Details */}
      {currentAssessment && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-blue-900">{currentAssessment.title}</p>
            <p className="text-sm text-blue-600">Total Marks: {currentAssessment.total_marks}</p>
          </div>
        </div>
      )}

      {/* Student Marks Table */}
      {selectedAssessment && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Enter Student Marks</h3>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-500 text-sm mt-2">Loading students...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">No students found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Admission No</th>
                    <th className="px-4 py-3">Marks</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.map((student) => {
                    const marksNum = Number(student.marks) || 0;
                    const total = currentAssessment?.total_marks || 100;
                    const pct = total > 0 ? ((marksNum / total) * 100).toFixed(1) : '0.0';
                    return (
                      <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {student.first_name} {student.last_name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{student.admission_no}</td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            max={currentAssessment?.total_marks}
                            value={student.marks}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || (Number(val) >= 0 && Number(val) <= currentAssessment?.total_marks)) {
                                updateMarks(student.id, val);
                              }
                            }}
                            className="w-24 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            placeholder="0"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{currentAssessment?.total_marks}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-700">{student.marks !== '' ? `${pct}%` : '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {students.length > 0 && (
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? 'Saving...' : 'Save Marks'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
