import React, { useEffect, useState, useCallback } from 'react';
import {
  Plus, X, ArrowUpRight, Filter, CheckSquare, Square, ArrowRight
} from 'lucide-react';
import api from '../../api/client';
import toast from 'react-hot-toast';

const SELECT_CLS =
  'appearance-none bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl px-4 py-1.5 shadow-sm cursor-pointer transition-all duration-200 hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary';

const STATUS_COLORS = {
  Promoted: 'bg-green-100 text-green-700 border border-green-200',
  'Held Back': 'bg-red-100 text-red-700 border border-red-200',
  Pending: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
};

export default function Promotions() {
  const [promotions, setPromotions] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterTrade, setFilterTrade] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Promote modal
  const [showModal, setShowModal] = useState(false);
  const [promoForm, setPromoForm] = useState({
    academic_year_id: '',
    trade_id: '',
    from_class_id: '',
    to_class_id: '',
  });
  const [selectedStudents, setSelectedStudents] = useState({});
  const [promoteAll, setPromoteAll] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchPromotions = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterTrade) params.trade_id = filterTrade;
      if (filterYear) params.academic_year_id = filterYear;
      if (filterStatus) params.status = filterStatus;
      const res = await api.get('/promotions', { params });
      setPromotions(res.data.data || []);
    } catch {
      toast.error('Failed to load promotions');
    } finally {
      setLoading(false);
    }
  }, [filterTrade, filterYear, filterStatus]);

  const fetchLookups = async () => {
    try {
      const [st, cl, ay, tr] = await Promise.all([
        api.get('/students'),
        api.get('/classes'),
        api.get('/academic-years'),
        api.get('/trades'),
      ]);
      setStudents(st.data.data || []);
      setClasses(cl.data.data || []);
      setAcademicYears(ay.data.data || []);
      setTrades(tr.data.data || []);
    } catch {
      toast.error('Failed to load lookup data');
    }
  };

  useEffect(() => { fetchLookups(); }, []);
  useEffect(() => { fetchPromotions(); }, [fetchPromotions]);

  // Filtered students for the modal based on trade and from_class
  const filteredStudentsForPromo = students.filter((s) => {
    if (!promoForm.trade_id && !promoForm.from_class_id) return false;
    let match = true;
    if (promoForm.trade_id) match = match && s.trade_id === promoForm.trade_id;
    if (promoForm.from_class_id) match = match && s.class_id === promoForm.from_class_id;
    return match && s.is_active !== false;
  });

  // Find next class (auto-promote logic: find class with next level in same trade)
  const getNextClass = (fromClassId) => {
    if (!fromClassId) return '';
    const fromClass = classes.find((c) => c.id === fromClassId);
    if (!fromClass) return '';
    // Try to find a class with a higher level in the same trade
    const sameTradeClasses = classes
      .filter((c) => c.trade_id === fromClass.trade_id && c.id !== fromClassId)
      .sort((a, b) => (a.level || 0) - (b.level || 0));
    const nextClass = sameTradeClasses.find((c) => (c.level || 0) > (fromClass.level || 0));
    return nextClass ? nextClass.id : '';
  };

  const handlePromoFormChange = (field, value) => {
    setPromoForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'trade_id') {
        updated.from_class_id = '';
        updated.to_class_id = '';
        setSelectedStudents({});
        setPromoteAll(false);
      }
      if (field === 'from_class_id') {
        updated.to_class_id = getNextClass(value);
        setSelectedStudents({});
        setPromoteAll(false);
      }
      return updated;
    });
  };

  const toggleStudent = (studentId) => {
    setSelectedStudents((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  };

  const togglePromoteAll = () => {
    if (promoteAll) {
      setSelectedStudents({});
      setPromoteAll(false);
    } else {
      const selected = {};
      filteredStudentsForPromo.forEach((s) => { selected[s.id] = true; });
      setSelectedStudents(selected);
      setPromoteAll(true);
    }
  };

  const handlePromote = async () => {
    if (!promoForm.academic_year_id || !promoForm.trade_id || !promoForm.from_class_id || !promoForm.to_class_id) {
      toast.error('Please fill in all required fields');
      return;
    }

    const selectedIds = Object.keys(selectedStudents).filter((id) => selectedStudents[id]);
    if (selectedIds.length === 0) {
      toast.error('Please select at least one student to promote');
      return;
    }

    const promotionsPayload = selectedIds.map((studentId) => ({
      student_id: studentId,
      from_class: promoForm.from_class_id,
      to_class: promoForm.to_class_id,
      academic_year_id: promoForm.academic_year_id,
      trade_id: promoForm.trade_id,
      status: 'Promoted',
    }));

    setSubmitting(true);
    try {
      await api.post('/promotions/promote', { promotions: promotionsPayload });
      toast.success(`${selectedIds.length} student(s) promoted successfully`);
      setShowModal(false);
      resetPromoForm();
      fetchPromotions();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to promote students');
    } finally {
      setSubmitting(false);
    }
  };

  const resetPromoForm = () => {
    setPromoForm({ academic_year_id: '', trade_id: '', from_class_id: '', to_class_id: '' });
    setSelectedStudents({});
    setPromoteAll(false);
  };

  const clearFilters = () => {
    setFilterTrade('');
    setFilterYear('');
    setFilterStatus('');
  };

  const hasFilters = filterTrade || filterYear || filterStatus;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Promotions</h1>
          <p className="text-gray-500 text-sm">Manage student transitions between academic years and classes.</p>
        </div>
        <button onClick={() => { resetPromoForm(); setShowModal(true); }}
          className="flex gap-1 active:scale-95 items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white text-sm font-medium shadow-lg hover:shadow-xl transition-all">
          <Plus className="w-4 h-4" />
          New Promotion Run
        </button>
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
          <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className={SELECT_CLS}>
            <option value="">All Academic Years</option>
            {academicYears.map((ay) => (
              <option key={ay.id} value={ay.id}>{ay.name}</option>
            ))}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={SELECT_CLS}>
            <option value="">All Statuses</option>
            <option value="Promoted">Promoted</option>
            <option value="Held Back">Held Back</option>
            <option value="Pending">Pending</option>
          </select>
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
                  <th>Student Name</th>
                  <th>Admission No</th>
                  <th>From Class</th>
                  <th>To Class</th>
                  <th>Academic Year</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {promotions.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-gray-400">
                      No promotions recorded.
                    </td>
                  </tr>
                ) : (
                  promotions.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="font-medium text-gray-900 text-sm">{p.first_name} {p.last_name}</td>
                      <td className="text-sm text-gray-500">{p.admission_no}</td>
                      <td className="text-sm">{p.from_class_name || 'N/A'}</td>
                      <td className="text-sm">{p.to_class_name || 'N/A'}</td>
                      <td className="text-sm">{p.academic_year_name || 'N/A'}</td>
                      <td>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[p.status] || 'bg-gray-100 text-gray-600'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="text-sm text-gray-500">
                        {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Promote Modal */}
      {showModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-xl flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
              <div>
                <h2 className="text-xl font-bold text-gray-900">New Promotion Run</h2>
                <p className="text-sm text-gray-500 mt-1">Select students and promote them to the next class</p>
              </div>
              <button onClick={() => { setShowModal(false); resetPromoForm(); }}
                className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {/* Cascade selectors */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year *</label>
                  <select value={promoForm.academic_year_id} onChange={(e) => handlePromoFormChange('academic_year_id', e.target.value)}
                    className={SELECT_CLS + ' w-full'}>
                    <option value="">Select Academic Year</option>
                    {academicYears.map((ay) => (
                      <option key={ay.id} value={ay.id}>{ay.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trade *</label>
                  <select value={promoForm.trade_id} onChange={(e) => handlePromoFormChange('trade_id', e.target.value)}
                    className={SELECT_CLS + ' w-full'}>
                    <option value="">Select Trade</option>
                    {trades.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Class *</label>
                  <select value={promoForm.from_class_id} onChange={(e) => handlePromoFormChange('from_class_id', e.target.value)}
                    className={SELECT_CLS + ' w-full'}>
                    <option value="">Select From Class</option>
                    {classes
                      .filter((c) => !promoForm.trade_id || c.trade_id === promoForm.trade_id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Class *</label>
                  <select value={promoForm.to_class_id} onChange={(e) => handlePromoFormChange('to_class_id', e.target.value)}
                    className={SELECT_CLS + ' w-full'}>
                    <option value="">Select To Class</option>
                    {classes
                      .filter((c) => !promoForm.trade_id || c.trade_id === promoForm.trade_id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Student selection */}
              {promoForm.trade_id && promoForm.from_class_id && (
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-semibold text-gray-700">
                      Students ({filteredStudentsForPromo.length})
                    </h3>
                    <button onClick={togglePromoteAll}
                      className="flex items-center gap-2 text-sm px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium border border-blue-200">
                      {promoteAll ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                      {promoteAll ? 'Deselect All' : 'Promote All'}
                    </button>
                  </div>

                  {filteredStudentsForPromo.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6">No students found for this trade and class.</p>
                  ) : (
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 text-gray-500">
                            <th className="text-center px-4 py-2.5 w-12"></th>
                            <th className="text-left px-4 py-2.5">Student Name</th>
                            <th className="text-left px-4 py-2.5">Admission No</th>
                            <th className="text-center px-4 py-2.5">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStudentsForPromo.map((student) => (
                            <tr key={student.id} className="border-t border-gray-100 hover:bg-gray-50/50">
                              <td className="px-4 py-2.5 text-center">
                                <button onClick={() => toggleStudent(student.id)} className="text-blue-600">
                                  {selectedStudents[student.id]
                                    ? <CheckSquare className="w-5 h-5" />
                                    : <Square className="w-5 h-5 text-gray-300" />
                                  }
                                </button>
                              </td>
                              <td className="px-4 py-2.5 font-medium text-gray-900">
                                {student.first_name} {student.last_name}
                              </td>
                              <td className="px-4 py-2.5 text-gray-500">{student.admission_no}</td>
                              <td className="px-4 py-2.5 text-center">
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                                  {classes.find((c) => c.id === promoForm.from_class_id)?.name || 'From'}
                                  <ArrowRight className="w-3 h-3" />
                                  {classes.find((c) => c.id === promoForm.to_class_id)?.name || 'To'}
                                </span>
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
              <button onClick={() => { setShowModal(false); resetPromoForm(); }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">
                Cancel
              </button>
              <button onClick={handlePromote} disabled={submitting}
                className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50">
                {submitting ? <span className="loading loading-spinner loading-sm"></span> : 'Promote Students'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
