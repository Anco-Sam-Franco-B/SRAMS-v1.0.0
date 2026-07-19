import React, { useEffect, useState } from 'react';
import { Check, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';

const STEPS = ['Trade', 'Academic Year', 'Term', 'Class', 'Subject', 'Date'];

export default function TeacherAttendance() {
  const [step, setStep] = useState(1);

  // Cascade data
  const [trades, setTrades] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [terms, setTerms] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Selections
  const [selectedTrade, setSelectedTrade] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [attendanceDate, setAttendanceDate] = useState('');

  // Student attendance
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load trades on mount
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

  // Load terms when year selected
  useEffect(() => {
    if (selectedYear) {
      api.get(`/terms?academic_year_id=${selectedYear}`)
        .then((res) => setTerms(res.data.data || res.data || []))
        .catch(() => toast.error('Failed to load terms'));
    }
  }, [selectedYear]);

  // Load classes when trade selected
  useEffect(() => {
    if (selectedTrade) {
      api.get(`/classes?trade_id=${selectedTrade}`)
        .then((res) => setClasses(res.data.data || res.data || []))
        .catch(() => toast.error('Failed to load classes'));
    }
  }, [selectedTrade]);

  // Load subjects when trade+class selected
  useEffect(() => {
    if (selectedTrade && selectedClass) {
      api.get(`/subjects?trade_id=${selectedTrade}&class_id=${selectedClass}`)
        .then((res) => setSubjects(res.data.data || res.data || []))
        .catch(() => toast.error('Failed to load subjects'));
    }
  }, [selectedTrade, selectedClass]);

  // Load students after all selections
  useEffect(() => {
    if (step === 6 && selectedClass && selectedTrade) {
      setLoading(true);
      api.get(`/students?class_id=${selectedClass}&trade_id=${selectedTrade}`)
        .then((res) => {
          const list = res.data.data || res.data || [];
          setStudents(list.map((s) => ({ ...s, status: 'PRESENT' })));
        })
        .catch(() => toast.error('Failed to load students'))
        .finally(() => setLoading(false));
    }
  }, [step, selectedClass, selectedTrade]);

  const handleSelect = (value, setter, nextStep) => {
    setter(value);
    setStep(nextStep);
  };

  const updateStatus = (id, status) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s))
    );
  };

  const markAll = (status) => {
    setStudents((prev) => prev.map((s) => ({ ...s, status })));
  };

  const handleSave = async () => {
    if (!attendanceDate) {
      toast.error('Please select a date');
      return;
    }
    setSaving(true);
    try {
      const payload = students.map((s) => ({
        student_id: s.id,
        class_id: selectedClass,
        term_id: selectedTerm,
        subject_id: selectedSubject,
        trade_id: selectedTrade,
        attendance_date: attendanceDate,
        status: s.status,
      }));
      await api.post('/attendance/mark', { attendance: payload });
      toast.success('Attendance saved successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mark Attendance</h1>
        <p className="text-gray-500 text-sm">Select the cascade options below, then mark student attendance.</p>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

          {/* Class */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => handleSelect(e.target.value, setSelectedClass, 5)}
              disabled={step < 4}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            >
              <option value="">Select Class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => handleSelect(e.target.value, setSelectedSubject, 6)}
              disabled={step < 5}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            >
              <option value="">Select Subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              disabled={step < 6}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      {/* Student Attendance Table */}
      {step === 6 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-semibold text-gray-900">Student Attendance</h3>
            <div className="flex gap-2">
              <button
                onClick={() => markAll('PRESENT')}
                className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
              >
                Mark All Present
              </button>
              <button
                onClick={() => markAll('ABSENT')}
                className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
              >
                Mark All Absent
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-500 text-sm mt-2">Loading students...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">No students found for this class.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Admission No</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {student.first_name} {student.last_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{student.admission_no}</td>
                      <td className="px-4 py-3">
                        <select
                          value={student.status}
                          onChange={(e) => updateStatus(student.id, e.target.value)}
                          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="PRESENT">Present</option>
                          <option value="ABSENT">Absent</option>
                          <option value="LATE">Late</option>
                          <option value="EXCUSED">Excused</option>
                          <option value="SICK">Sick</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {students.length > 0 && (
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={handleSave}
                disabled={saving || !attendanceDate}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? 'Saving...' : 'Save Attendance'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
