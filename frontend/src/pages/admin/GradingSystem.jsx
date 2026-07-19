import React, { useEffect, useState, useCallback } from 'react';
import { Award, Plus, X, Loader2, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';

export default function GradingSystem() {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formData, setFormData] = useState({ grade: '', min_mark: '', max_mark: '', remarks: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchGrades = useCallback(async () => {
    try {
      const response = await api.get('/grading-system');
      setGrades(response.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch grading system');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGrades();
  }, [fetchGrades]);

  const sorted = [...grades].sort((a, b) => b.min_mark - a.min_mark);

  const validateRange = (min, max, excludeId) => {
    if (min >= max) {
      toast.error('Minimum mark must be less than maximum mark');
      return false;
    }
    const overlap = grades.some(
      (g) =>
        g.id !== excludeId &&
        ((min >= g.min_mark && min <= g.max_mark) ||
          (max >= g.min_mark && max <= g.max_mark) ||
          (min <= g.min_mark && max >= g.max_mark))
    );
    if (overlap) {
      toast.error('This range overlaps with an existing grade');
      return false;
    }
    return true;
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openCreateModal = () => {
    setEditingGrade(null);
    setFormData({ grade: '', min_mark: '', max_mark: '', remarks: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (grade) => {
    setEditingGrade(grade);
    setFormData({
      grade: grade.grade,
      min_mark: grade.min_mark,
      max_mark: grade.max_mark,
      remarks: grade.remarks,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const min = Number(formData.min_mark);
    const max = Number(formData.max_mark);
    if (!validateRange(min, max, editingGrade?.id)) return;

    setSubmitting(true);
    try {
      const payload = { ...formData, min_mark: min, max_mark: max };
      if (editingGrade) {
        await api.put(`/grading-system/${editingGrade.id}`, payload);
        toast.success('Grade updated');
      } else {
        await api.post('/grading-system', payload);
        toast.success('Grade created');
      }
      setIsModalOpen(false);
      setEditingGrade(null);
      fetchGrades();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save grade');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/grading-system/${deleteTarget.id}`);
      toast.success('Grade deleted');
      setDeleteTarget(null);
      fetchGrades();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete grade');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Grading System</h1>
          <p className="text-gray-500 text-sm">Configure grade scales and boundaries.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl shadow-sm hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Add Grade
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 border-b border-gray-100">
                  <th className="text-left p-3 font-medium">Grade</th>
                  <th className="text-left p-3 font-medium">Min Mark</th>
                  <th className="text-left p-3 font-medium">Max Mark</th>
                  <th className="text-left p-3 font-medium">Remarks</th>
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-gray-500">
                      No grading rules configured.
                    </td>
                  </tr>
                ) : (
                  sorted.map((grade) => (
                    <tr key={grade.id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-0">
                      <td className="p-3 font-bold text-gray-900">{grade.grade}</td>
                      <td className="p-3">{grade.min_mark}%</td>
                      <td className="p-3">{grade.max_mark}%</td>
                      <td className="p-3">
                        <span className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg">
                          {grade.remarks}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(grade)}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Edit grade"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(grade)}
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete grade"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                {editingGrade ? 'Edit Grade' : 'Add New Grade'}
              </h2>
              <button
                onClick={() => { setIsModalOpen(false); setEditingGrade(null); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grade <span className="text-red-600">*</span>
                </label>
                <input
                  required
                  type="text"
                  name="grade"
                  value={formData.grade}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="e.g. A, B+, C"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Mark <span className="text-red-600">*</span>
                  </label>
                  <input
                    required
                    type="number"
                    name="min_mark"
                    value={formData.min_mark}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Mark <span className="text-red-600">*</span>
                  </label>
                  <input
                    required
                    type="number"
                    name="max_mark"
                    value={formData.max_mark}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Remarks <span className="text-red-600">*</span>
                </label>
                <input
                  required
                  type="text"
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="e.g. Excellent, Good, Average"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setEditingGrade(null); }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingGrade ? 'Update Grade' : 'Save Grade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl">
            <div className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Delete Grade</h3>
              <p className="text-gray-500 text-sm mt-2">
                Are you sure you want to delete grade <strong>{deleteTarget.grade}</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="flex border-t border-gray-100">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors border-l border-gray-100"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
