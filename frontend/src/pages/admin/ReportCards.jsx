import React, { useEffect, useState, useCallback } from 'react';
import {
  FileText,
  Plus,
  X,
  Search,
  Printer,
  Download,
  Eye,
  Trash2,
  Edit2,
  ChevronDown,
  ArrowUpDown,
} from 'lucide-react';
import api from '../../api/client';
import toast from 'react-hot-toast';

export default function ReportCards() {
  const [reports, setReports] = useState([]);
  const [trades, setTrades] = useState([]);
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterTrade, setFilterTrade] = useState('');
  const [filterTerm, setFilterTerm] = useState('');
  const [sortPosition, setSortPosition] = useState(false);

  // Generate modal
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [genTrade, setGenTrade] = useState('');
  const [genTerm, setGenTerm] = useState('');
  const [generating, setGenerating] = useState(false);

  // Preview modal
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewReport, setPreviewReport] = useState(null);

  // Edit modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editReport, setEditReport] = useState(null);
  const [editForm, setEditForm] = useState({
    total_marks: '',
    average: '',
    position: '',
    teacher_comment: '',
  });
  const [saving, setSaving] = useState(false);

  // Delete
  const [deletingId, setDeletingId] = useState(null);

  // ── Data fetching ──────────────────────────────────────────
  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterTrade) params.trade_id = filterTrade;
      if (filterTerm) params.term_id = filterTerm;
      const response = await api.get('/report-cards', { params });
      setReports(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch report cards', error);
      toast.error('Failed to load report cards');
    } finally {
      setLoading(false);
    }
  }, [filterTrade, filterTerm]);

  const fetchTrades = async () => {
    try {
      const response = await api.get('/trades');
      setTrades(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch trades', error);
    }
  };

  const fetchTerms = async () => {
    try {
      const response = await api.get('/terms');
      setTerms(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch terms', error);
    }
  };

  useEffect(() => {
    fetchTrades();
    fetchTerms();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // ── Generate ───────────────────────────────────────────────
  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!genTrade || !genTerm) {
      toast.error('Please select both trade and term');
      return;
    }
    setGenerating(true);
    try {
      await api.post('/report-cards/generate', {
        trade_id: genTrade,
        term_id: genTerm,
      });
      toast.success('Report cards generated successfully');
      setIsGenerateOpen(false);
      setGenTrade('');
      setGenTerm('');
      fetchReports();
    } catch (error) {
      console.error('Error generating report cards', error);
      toast.error(error.response?.data?.error || 'Failed to generate report cards');
    } finally {
      setGenerating(false);
    }
  };

  // ── Edit ───────────────────────────────────────────────────
  const openEditModal = (report) => {
    setEditReport(report);
    setEditForm({
      total_marks: report.total_marks ?? '',
      average: report.average ?? '',
      position: report.position ?? '',
      teacher_comment: report.teacher_comment ?? '',
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/report-cards/${editReport.id}`, {
        total_marks: Number(editForm.total_marks),
        average: Number(editForm.average),
        position: Number(editForm.position),
        teacher_comment: editForm.teacher_comment,
      });
      toast.success('Report card updated');
      setIsEditOpen(false);
      fetchReports();
    } catch (error) {
      console.error('Error updating report card', error);
      toast.error(error.response?.data?.error || 'Failed to update report card');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this report card?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/report-cards/${id}`);
      toast.success('Report card deleted');
      fetchReports();
    } catch (error) {
      console.error('Error deleting report card', error);
      toast.error(error.response?.data?.error || 'Failed to delete report card');
    } finally {
      setDeletingId(null);
    }
  };

  // ── Preview ────────────────────────────────────────────────
  const openPreview = (report) => {
    setPreviewReport(report);
    setIsPreviewOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  // ── Helpers ────────────────────────────────────────────────
  const getTradeName = (id) => trades.find((t) => t.id === id)?.name || 'N/A';
  const getTermName = (id) => terms.find((t) => t.id === id)?.name || 'N/A';

  const gradeFromAvg = (avg) => {
    if (avg >= 80) return 'A';
    if (avg >= 70) return 'B';
    if (avg >= 60) return 'C';
    if (avg >= 50) return 'D';
    return 'F';
  };

  const sortedReports = sortPosition
    ? [...reports].sort((a, b) => (a.position || Infinity) - (b.position || Infinity))
    : reports;

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Report Cards</h1>
          <p className="text-gray-500 text-sm">
            Generate and manage end-of-term student report cards.
          </p>
        </div>
        <button
          onClick={() => setIsGenerateOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Generate New Reports
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter reports..."
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-56"
          />
        </div>

        <select
          value={filterTrade}
          onChange={(e) => setFilterTrade(e.target.value)}
          className="appearance-none bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl px-4 py-2 shadow-sm cursor-pointer transition-all duration-200 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        >
          <option value="">All Trades</option>
          {trades.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        <select
          value={filterTerm}
          onChange={(e) => setFilterTerm(e.target.value)}
          className="appearance-none bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl px-4 py-2 shadow-sm cursor-pointer transition-all duration-200 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        >
          <option value="">All Terms</option>
          {terms.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        <button
          onClick={() => setSortPosition(!sortPosition)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
            sortPosition
              ? 'bg-blue-50 border-blue-200 text-blue-700'
              : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
          }`}
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
          Position
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center p-12">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-sm text-gray-500">Loading report cards...</p>
              </div>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">
                    Student Name
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">
                    Admission No
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">
                    Class
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">
                    Term
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">
                    Total Marks
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">
                    Average
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">
                    Position
                  </th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sortedReports.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="text-center py-12 text-gray-400 text-sm"
                    >
                      No report cards found.
                    </td>
                  </tr>
                ) : (
                  sortedReports.map((report) => (
                    <tr
                      key={report.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-3.5 font-medium text-gray-900 text-sm">
                        {report.student_name ||
                          `${report.first_name || ''} ${report.last_name || ''}`.trim() ||
                          'N/A'}
                      </td>
                      <td className="px-6 py-3.5 text-gray-600 text-sm">
                        {report.admission_no || 'N/A'}
                      </td>
                      <td className="px-6 py-3.5 text-gray-600 text-sm">
                        {report.class_name || 'N/A'}
                      </td>
                      <td className="px-6 py-3.5 text-gray-600 text-sm">
                        {getTermName(report.term_id)}
                      </td>
                      <td className="px-6 py-3.5 text-gray-900 text-sm font-medium">
                        {report.total_marks ?? 'N/A'}
                      </td>
                      <td className="px-6 py-3.5 text-sm">
                        <span className="font-medium text-gray-900">
                          {report.average ? Number(report.average).toFixed(1) : 'N/A'}
                          {report.average ? '%' : ''}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-sm">
                        {report.position ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-50 text-blue-700 font-bold text-xs">
                            {report.position}
                          </span>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openPreview(report)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(report)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(report.id)}
                            disabled={deletingId === report.id}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            {deletingId === report.id ? (
                              <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Generate Modal ──────────────────────────────────── */}
      {isGenerateOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Generate Report Cards
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Select a trade and term to generate reports
                </p>
              </div>
              <button
                onClick={() => setIsGenerateOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleGenerate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Trade *
                </label>
                <select
                  required
                  value={genTrade}
                  onChange={(e) => setGenTrade(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="">Select a trade</option>
                  {trades.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Term *
                </label>
                <select
                  required
                  value={genTerm}
                  onChange={(e) => setGenTerm(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="">Select a term</option>
                  {terms.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsGenerateOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-medium shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                >
                  {generating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      Generate
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Modal ──────────────────────────────────────── */}
      {isEditOpen && editReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Edit Report Card
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {editReport.student_name ||
                    `${editReport.first_name || ''} ${editReport.last_name || ''}`.trim() ||
                    'Student'}
                </p>
              </div>
              <button
                onClick={() => setIsEditOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Total Marks
                  </label>
                  <input
                    type="number"
                    value={editForm.total_marks}
                    onChange={(e) =>
                      setEditForm({ ...editForm, total_marks: e.target.value })
                    }
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Average
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editForm.average}
                    onChange={(e) =>
                      setEditForm({ ...editForm, average: e.target.value })
                    }
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Position
                </label>
                <input
                  type="number"
                  value={editForm.position}
                  onChange={(e) =>
                    setEditForm({ ...editForm, position: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Teacher Comment
                </label>
                <textarea
                  rows={3}
                  value={editForm.teacher_comment}
                  onChange={(e) =>
                    setEditForm({ ...editForm, teacher_comment: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                  placeholder="Enter teacher comment..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-medium shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Preview Modal ───────────────────────────────────── */}
      {isPreviewOpen && previewReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-xl flex flex-col">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/80 print:hidden">
              <h2 className="text-lg font-bold text-gray-900">Report Card Preview</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Report Card */}
            <div className="overflow-y-auto p-6 print:p-0 print:overflow-visible">
              <div className="report-card print:shadow-none" id="report-card-preview">
                {/* School Header */}
                <div className="text-center mb-6 border-b-2 border-gray-900 pb-4">
                  <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                    SRAMS
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Student Records & Academic Management System
                  </p>
                </div>

                {/* Student Info */}
                <div className="grid grid-cols-2 gap-4 mb-6 bg-gray-50 rounded-xl p-4">
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-medium">Student Name</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">
                      {previewReport.student_name ||
                        `${previewReport.first_name || ''} ${previewReport.last_name || ''}`.trim() ||
                        'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-medium">Admission No</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">
                      {previewReport.admission_no || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-medium">Class</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">
                      {previewReport.class_name || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-medium">Trade</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">
                      {getTradeName(previewReport.trade_id)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-medium">Term</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">
                      {getTermName(previewReport.term_id)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-medium">Academic Year</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">
                      {previewReport.academic_year || new Date().getFullYear()}
                    </p>
                  </div>
                </div>

                {/* Marks Table */}
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">
                    Subject Performance
                  </h3>
                  {previewReport.marks && previewReport.marks.length > 0 ? (
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="text-left px-3 py-2 font-semibold text-gray-700 border border-gray-200">
                            Subject
                          </th>
                          <th className="text-center px-3 py-2 font-semibold text-gray-700 border border-gray-200">
                            CA
                          </th>
                          <th className="text-center px-3 py-2 font-semibold text-gray-700 border border-gray-200">
                            Exam
                          </th>
                          <th className="text-center px-3 py-2 font-semibold text-gray-700 border border-gray-200">
                            Total
                          </th>
                          <th className="text-center px-3 py-2 font-semibold text-gray-700 border border-gray-200">
                            Grade
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewReport.marks.map((mark, i) => {
                          const total = (mark.ca_score || 0) + (mark.exam_score || 0);
                          const grade = gradeFromAvg(total);
                          return (
                            <tr key={i} className="hover:bg-gray-50">
                              <td className="px-3 py-2 border border-gray-200 font-medium text-gray-900">
                                {mark.subject_name || 'N/A'}
                              </td>
                              <td className="px-3 py-2 border border-gray-200 text-center text-gray-600">
                                {mark.ca_score ?? '-'}
                              </td>
                              <td className="px-3 py-2 border border-gray-200 text-center text-gray-600">
                                {mark.exam_score ?? '-'}
                              </td>
                              <td className="px-3 py-2 border border-gray-200 text-center font-medium text-gray-900">
                                {total}
                              </td>
                              <td className="px-3 py-2 border border-gray-200 text-center font-bold">
                                <span
                                  className={
                                    grade === 'A'
                                      ? 'text-green-600'
                                      : grade === 'B'
                                      ? 'text-blue-600'
                                      : grade === 'C'
                                      ? 'text-amber-600'
                                      : 'text-red-600'
                                  }
                                >
                                  {grade}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-gray-400 text-sm italic py-4 text-center bg-gray-50 rounded-xl">
                      No subject marks available for this report.
                    </p>
                  )}
                </div>

                {/* Summary */}
                <div className="grid grid-cols-4 gap-3 mb-6">
                  <div className="bg-blue-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-blue-500 font-medium">Total Marks</p>
                    <p className="text-xl font-bold text-blue-700 mt-1">
                      {previewReport.total_marks ?? 'N/A'}
                    </p>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-emerald-500 font-medium">Average</p>
                    <p className="text-xl font-bold text-emerald-700 mt-1">
                      {previewReport.average
                        ? `${Number(previewReport.average).toFixed(1)}%`
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-purple-500 font-medium">Position</p>
                    <p className="text-xl font-bold text-purple-700 mt-1">
                      {previewReport.position ? `#${previewReport.position}` : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-amber-500 font-medium">Grade</p>
                    <p className="text-xl font-bold text-amber-700 mt-1">
                      {previewReport.average
                        ? gradeFromAvg(Number(previewReport.average))
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Teacher Comment */}
                {previewReport.teacher_comment && (
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <p className="text-xs text-gray-400 uppercase font-medium mb-1.5">
                      Teacher&apos;s Comment
                    </p>
                    <p className="text-sm text-gray-700 italic leading-relaxed">
                      &ldquo;{previewReport.teacher_comment}&rdquo;
                    </p>
                  </div>
                )}

                {/* Footer */}
                <div className="border-t border-gray-200 pt-4 mt-6 text-center">
                  <p className="text-xs text-gray-400">
                    This report card was generated by SRAMS &mdash; Student Records &amp; Academic
                    Management System
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
