import React, { useEffect, useState, useCallback } from 'react';
import {
  CheckSquare, Plus, Search, X, FileSpreadsheet, Filter,
  ChevronDown, Users, Calendar, BookOpen
} from 'lucide-react';
import api from '../../api/client';
import toast from 'react-hot-toast';

const SELECT_CLS =
  'appearance-none bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl px-4 py-1.5 shadow-sm cursor-pointer transition-all duration-200 hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary';

const INPUT_CLS =
  'w-full bg-white border border-gray-200 text-gray-700 text-sm rounded-xl px-4 py-1.5 shadow-sm transition-all duration-200 hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary';

const STATUS_COLORS = {
  PRESENT: 'bg-green-100 text-green-700 border border-green-200',
  ABSENT: 'bg-red-100 text-red-700 border border-red-200',
  LATE: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  EXCUSED: 'bg-blue-100 text-blue-700 border border-blue-200',
  SICK: 'bg-gray-100 text-gray-700 border border-gray-200',
};

const STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'SICK'];

export default function Attendance() {
  const [attendance, setAttendance] = useState([]);
  const [trades, setTrades] = useState([]);
  const [classes, setClasses] = useState([]);
  const [terms, setTerms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterTrade, setFilterTrade] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Mark modal
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [markForm, setMarkForm] = useState({
    trade_id: '',
    academic_year_id: '',
    term_id: '',
    class_id: '',
    subject_id: '',
    attendance_date: new Date().toISOString().split('T')[0],
    teacher_id: '',
  });
  const [studentStatuses, setStudentStatuses] = useState({});
  const [markingSaving, setMarkingSaving] = useState(false);

  // Report modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportClassId, setReportClassId] = useState('');
  const [reportTermId, setReportTermId] = useState('');
  const [reportData, setReportData] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterTrade) params.trade_id = filterTrade;
      if (filterClass) params.class_id = filterClass;
      if (filterStatus) params.status = filterStatus;
      if (filterStartDate) params.start_date = filterStartDate;
      if (filterEndDate) params.end_date = filterEndDate;
      const res = await api.get('/attendance', { params });
      setAttendance(res.data.data || []);
    } catch {
      toast.error('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  }, [filterTrade, filterClass, filterStatus, filterStartDate, filterEndDate]);

  const fetchLookups = async () => {
    try {
      const [t, c, te, s, ay, th, st] = await Promise.all([
        api.get('/trades'),
        api.get('/classes'),
        api.get('/terms'),
        api.get('/subjects'),
        api.get('/academic-years'),
        api.get('/teachers').catch(() => ({ data: { data: [] } })),
        api.get('/students').catch(() => ({ data: { data: [] } })),
      ]);
      setTrades(t.data.data || []);
      setClasses(c.data.data || []);
      setTerms(te.data.data || []);
      setSubjects(s.data.data || []);
      setAcademicYears(ay.data.data || []);
      setTeachers(th.data.data || []);
      setAllStudents(st.data.data || []);
    } catch {
      toast.error('Failed to load lookup data');
    }
  };

  useEffect(() => {
    fetchLookups();
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // Cascade filtering for mark modal
  const filteredTerms = markForm.academic_year_id
    ? terms.filter((t) => t.academic_year_id === markForm.academic_year_id)
    : terms;

  const filteredClasses = markForm.trade_id
    ? classes.filter((c) => c.trade_id === markForm.trade_id)
    : classes;

  const filteredStudents = markForm.class_id
    ? allStudents.filter((s) => s.class_id === markForm.class_id && s.is_active !== false)
    : [];

  const handleMarkFormChange = (field, value) => {
    setMarkForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'trade_id') {
        updated.academic_year_id = '';
        updated.term_id = '';
        updated.class_id = '';
      }
      if (field === 'academic_year_id') {
        updated.term_id = '';
      }
      if (field === 'class_id') {
        setStudentStatuses({});
      }
      return updated;
    });
  };

  const handleStatusChange = (studentId, status) => {
    setStudentStatuses((prev) => ({ ...prev, [studentId]: status }));
  };

  const markAllPresent = () => {
    const statuses = {};
    filteredStudents.forEach((s) => {
      statuses[s.id] = 'PRESENT';
    });
    setStudentStatuses(statuses);
    toast.success('All students marked as PRESENT');
  };

  const handleSaveAttendance = async () => {
    const missingSubject = !markForm.subject_id;
    const missingTeacher = !markForm.teacher_id;
    const missingDate = !markForm.attendance_date;

    if (missingSubject || missingTeacher || missingDate) {
      toast.error('Please fill in Subject, Teacher, and Date');
      return;
    }

    const entries = filteredStudents
      .filter((s) => studentStatuses[s.id])
      .map((s) => ({
        student_id: s.id,
        teacher_id: markForm.teacher_id,
        class_id: markForm.class_id,
        term_id: markForm.term_id,
        subject_id: markForm.subject_id,
        trade_id: markForm.trade_id,
        attendance_date: markForm.attendance_date,
        status: studentStatuses[s.id],
      }));

    if (entries.length === 0) {
      toast.error('Please set status for at least one student');
      return;
    }

    setMarkingSaving(true);
    try {
      await api.post('/attendance/mark', { attendance: entries });
      toast.success(`Attendance marked for ${entries.length} student(s)`);
      setShowMarkModal(false);
      resetMarkForm();
      fetchAttendance();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to mark attendance');
    } finally {
      setMarkingSaving(false);
    }
  };

  const resetMarkForm = () => {
    setMarkForm({
      trade_id: '',
      academic_year_id: '',
      term_id: '',
      class_id: '',
      subject_id: '',
      attendance_date: new Date().toISOString().split('T')[0],
      teacher_id: '',
    });
    setStudentStatuses({});
  };

  const handleGenerateReport = async () => {
    if (!reportClassId || !reportTermId) {
      toast.error('Please select both Class and Term');
      return;
    }
    setReportLoading(true);
    try {
      const res = await api.get('/attendance/report', {
        params: { class_id: reportClassId, term_id: reportTermId },
      });
      setReportData(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to generate report');
    } finally {
      setReportLoading(false);
    }
  };

  const clearFilters = () => {
    setFilterTrade('');
    setFilterClass('');
    setFilterStatus('');
    setFilterStartDate('');
    setFilterEndDate('');
  };

  const hasFilters = filterTrade || filterClass || filterStatus || filterStartDate || filterEndDate;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
          <p className="text-gray-500 text-sm">Track and manage student attendance records.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowReportModal(true)}
            className="flex gap-1 active:scale-95 items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium shadow-sm hover:bg-gray-50 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Generate Report
          </button>
          <button
            onClick={() => { resetMarkForm(); setShowMarkModal(true); }}
            className="flex gap-1 active:scale-95 items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white text-sm font-medium shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="w-4 h-4" />
            Mark Attendance
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Filter className="w-4 h-4" />
            <span className="font-medium">Filters</span>
          </div>
          <select value={filterTrade} onChange={(e) => setFilterTrade(e.target.value)} className={SELECT_CLS}>
            <option value="">All Trades</option>
            {trades.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className={SELECT_CLS}>
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={SELECT_CLS}>
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)}
            className={INPUT_CLS + ' w-40'} placeholder="Start Date" />
          <input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)}
            className={INPUT_CLS + ' w-40'} placeholder="End Date" />
          {hasFilters && (
            <button onClick={clearFilters} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center p-12">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : (
            <table className="table w-full">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm">
                  <th>Date</th>
                  <th>Student Name</th>
                  <th>Class</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Teacher</th>
                </tr>
              </thead>
              <tbody>
                {attendance.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-gray-400">
                      No attendance records found.
                    </td>
                  </tr>
                ) : (
                  attendance.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="text-sm">{new Date(record.attendance_date).toLocaleDateString()}</td>
                      <td className="font-medium text-gray-900 text-sm">
                        {record.first_name} {record.last_name}
                      </td>
                      <td className="text-sm">{record.class_name || 'N/A'}</td>
                      <td className="text-sm">{record.subject_name || 'N/A'}</td>
                      <td>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[record.status] || 'bg-gray-100 text-gray-600'}`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="text-sm text-gray-500">{record.teacher_name || 'N/A'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Mark Attendance Modal */}
      {showMarkModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-xl flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Mark Attendance</h2>
                <p className="text-sm text-gray-500 mt-1">Select class details and mark student attendance</p>
              </div>
              <button onClick={() => { setShowMarkModal(false); resetMarkForm(); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {/* Cascade selectors */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trade *</label>
                  <select value={markForm.trade_id} onChange={(e) => handleMarkFormChange('trade_id', e.target.value)} className={SELECT_CLS + ' w-full'}>
                    <option value="">Select Trade</option>
                    {trades.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year *</label>
                  <select value={markForm.academic_year_id} onChange={(e) => handleMarkFormChange('academic_year_id', e.target.value)} className={SELECT_CLS + ' w-full'}>
                    <option value="">Select Academic Year</option>
                    {academicYears.map((ay) => (
                      <option key={ay.id} value={ay.id}>{ay.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Term *</label>
                  <select value={markForm.term_id} onChange={(e) => handleMarkFormChange('term_id', e.target.value)} className={SELECT_CLS + ' w-full'}>
                    <option value="">Select Term</option>
                    {filteredTerms.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                  <select value={markForm.class_id} onChange={(e) => handleMarkFormChange('class_id', e.target.value)} className={SELECT_CLS + ' w-full'}>
                    <option value="">Select Class</option>
                    {filteredClasses.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                  <select value={markForm.subject_id} onChange={(e) => handleMarkFormChange('subject_id', e.target.value)} className={SELECT_CLS + ' w-full'}>
                    <option value="">Select Subject</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teacher *</label>
                  <select value={markForm.teacher_id} onChange={(e) => handleMarkFormChange('teacher_id', e.target.value)} className={SELECT_CLS + ' w-full'}>
                    <option value="">Select Teacher</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input type="date" value={markForm.attendance_date} onChange={(e) => handleMarkFormChange('attendance_date', e.target.value)}
                    className={INPUT_CLS} />
                </div>
              </div>

              {/* Student list */}
              {markForm.class_id && (
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-semibold text-gray-700">
                      Students ({filteredStudents.length})
                    </h3>
                    <button onClick={markAllPresent}
                      className="text-sm px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-medium border border-green-200">
                      Mark All Present
                    </button>
                  </div>

                  {filteredStudents.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6">No students found in this class.</p>
                  ) : (
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 text-gray-500">
                            <th className="text-left px-4 py-2.5">Student Name</th>
                            <th className="text-left px-4 py-2.5">Admission No</th>
                            <th className="text-right px-4 py-2.5">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStudents.map((student) => (
                            <tr key={student.id} className="border-t border-gray-100 hover:bg-gray-50/50">
                              <td className="px-4 py-2.5 font-medium text-gray-900">
                                {student.first_name} {student.last_name}
                              </td>
                              <td className="px-4 py-2.5 text-gray-500">{student.admission_no}</td>
                              <td className="px-4 py-2.5 text-right">
                                <select
                                  value={studentStatuses[student.id] || ''}
                                  onChange={(e) => handleStatusChange(student.id, e.target.value)}
                                  className={`text-xs font-medium rounded-lg px-3 py-1.5 border transition-all ${
                                    studentStatuses[student.id]
                                      ? STATUS_COLORS[studentStatuses[student.id]]
                                      : 'border-gray-200 text-gray-500 bg-white'
                                  } focus:outline-none focus:ring-2 focus:ring-primary/30`}
                                >
                                  <option value="">-- Select --</option>
                                  {STATUSES.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                  ))}
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50">
              <button onClick={() => { setShowMarkModal(false); resetMarkForm(); }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">
                Cancel
              </button>
              <button onClick={handleSaveAttendance} disabled={markingSaving}
                className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50">
                {markingSaving ? <span className="loading loading-spinner loading-sm"></span> : 'Save Attendance'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Attendance Report</h2>
                <p className="text-sm text-gray-500 mt-1">Per-student attendance summary by class and term</p>
              </div>
              <button onClick={() => { setShowReportModal(false); setReportData([]); setReportClassId(''); setReportTermId(''); }}
                className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="flex gap-4 items-end mb-6">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                  <select value={reportClassId} onChange={(e) => setReportClassId(e.target.value)} className={SELECT_CLS + ' w-full'}>
                    <option value="">Select Class</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
                  <select value={reportTermId} onChange={(e) => setReportTermId(e.target.value)} className={SELECT_CLS + ' w-full'}>
                    <option value="">Select Term</option>
                    {terms.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <button onClick={handleGenerateReport} disabled={reportLoading}
                  className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 whitespace-nowrap">
                  {reportLoading ? <span className="loading loading-spinner loading-sm"></span> : 'Generate'}
                </button>
              </div>

              {reportData.length > 0 && (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500">
                        <th className="text-left px-4 py-2.5">Student</th>
                        <th className="text-left px-4 py-2.5">Admission No</th>
                        <th className="text-center px-4 py-2.5">Present</th>
                        <th className="text-center px-4 py-2.5">Absent</th>
                        <th className="text-center px-4 py-2.5">Late</th>
                        <th className="text-center px-4 py-2.5">Total Days</th>
                        <th className="text-center px-4 py-2.5">Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.map((row) => {
                        const rate = row.total_days > 0
                          ? ((row.present_count / row.total_days) * 100).toFixed(1)
                          : '0.0';
                        return (
                          <tr key={row.id} className="border-t border-gray-100 hover:bg-gray-50/50">
                            <td className="px-4 py-2.5 font-medium text-gray-900">{row.first_name} {row.last_name}</td>
                            <td className="px-4 py-2.5 text-gray-500">{row.admission_no}</td>
                            <td className="px-4 py-2.5 text-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                {row.present_count}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                {row.absent_count}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                                {row.late_count}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-center font-medium">{row.total_days}</td>
                            <td className="px-4 py-2.5 text-center">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                                parseFloat(rate) >= 75 ? 'bg-green-100 text-green-700' :
                                parseFloat(rate) >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {rate}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {reportData.length === 0 && reportClassId && reportTermId && !reportLoading && (
                <p className="text-center text-gray-400 py-8">No report data found for the selected class and term.</p>
              )}
            </div>

            <div className="flex justify-end p-6 border-t border-gray-100 bg-gray-50">
              <button onClick={() => { setShowReportModal(false); setReportData([]); setReportClassId(''); setReportTermId(''); }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
