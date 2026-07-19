import React, { useEffect, useState } from 'react';
import { CalendarDays, Plus, X, Edit2, Trash2 } from 'lucide-react';
import api from '../../api/client';
import toast from 'react-hot-toast';

export default function Terms() {
    const [terms, setTerms] = useState([]);
    const [academicYears, setAcademicYears] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        academic_year_id: '',
        start_date: '',
        end_date: '',
        is_current: false
    });
    const [submitting, setSubmitting] = useState(false);

    const fetchTerms = async () => {
        try {
            const response = await api.get('/terms');
            setTerms(response.data.data || []);
        } catch (error) {
            console.error("Failed to fetch terms", error);
            toast.error("Failed to load terms");
        } finally {
            setLoading(false);
        }
    };

    const fetchAcademicYears = async () => {
        try {
            const response = await api.get('/academic-years');
            setAcademicYears(response.data.data || []);
        } catch (error) {
            console.error("Failed to fetch academic years", error);
        }
    };

    useEffect(() => {
        fetchTerms();
        fetchAcademicYears();
    }, []);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    };

    const openCreateModal = () => {
        setIsEditMode(false);
        setEditingId(null);
        setFormData({ name: '', academic_year_id: '', start_date: '', end_date: '', is_current: false });
        setIsModalOpen(true);
    };

    const openEditModal = (term) => {
        setIsEditMode(true);
        setEditingId(term.id);
        setFormData({
            name: term.name || '',
            academic_year_id: term.academic_year_id || '',
            start_date: term.start_date ? term.start_date.split('T')[0] : '',
            end_date: term.end_date ? term.end_date.split('T')[0] : '',
            is_current: term.is_current || false
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setIsEditMode(false);
        setEditingId(null);
        setFormData({ name: '', academic_year_id: '', start_date: '', end_date: '', is_current: false });
    };

    const handleCreateTerm = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = { ...formData };
            if (!payload.start_date) delete payload.start_date;
            if (!payload.end_date) delete payload.end_date;
            
            await api.post('/terms', payload);
            toast.success("Term created successfully");
            closeModal();
            fetchTerms();
        } catch (error) {
            console.error("Error creating term", error);
            toast.error(error.response?.data?.error || "Failed to create term");
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateTerm = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = { ...formData };
            if (!payload.start_date) delete payload.start_date;
            if (!payload.end_date) delete payload.end_date;
            
            await api.put(`/terms/${editingId}`, payload);
            toast.success("Term updated successfully");
            closeModal();
            fetchTerms();
        } catch (error) {
            console.error("Error updating term", error);
            toast.error(error.response?.data?.error || "Failed to update term");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteTerm = async (id) => {
        if (!window.confirm('Are you sure you want to delete this term?')) return;
        try {
            await api.delete(`/terms/${id}`);
            toast.success("Term deleted successfully");
            fetchTerms();
        } catch (error) {
            console.error("Error deleting term", error);
            toast.error(error.response?.data?.error || "Failed to delete term");
        }
    };

    const getAcademicYearName = (yearId) => {
        const year = academicYears.find(y => y.id === yearId);
        return year ? year.name : 'N/A';
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Academic Terms</h1>
                    <p className="text-gray-500 text-sm">Manage terms within academic years.</p>
                </div>
                <button onClick={openCreateModal} className="flex gap-1 active:scale-95 items-center p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-md text-white shadow-lg">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Term
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex justify-center p-8"><span className="loading loading-spinner loading-lg"></span></div>
                    ) : (
                        <table className="table w-full">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500">
                                    <th>Name</th>
                                    <th>Academic Year</th>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {terms.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-8 text-gray-500">No terms found.</td>
                                    </tr>
                                ) : (
                                    terms.map((term) => (
                                        <tr key={term.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="font-medium text-gray-900">{term.name}</td>
                                            <td>{getAcademicYearName(term.academic_year_id)}</td>
                                            <td>{term.start_date ? new Date(term.start_date).toLocaleDateString() : 'N/A'}</td>
                                            <td>{term.end_date ? new Date(term.end_date).toLocaleDateString() : 'N/A'}</td>
                                            <td>
                                                <span className={`badge ${term.is_current ? 'badge-success' : 'badge-ghost'} badge-sm`}>
                                                    {term.is_current ? 'Current' : 'Past'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex gap-2">
                                                    <button onClick={() => openEditModal(term)} className="btn btn-ghost btn-xs text-primary">
                                                        <Edit2 className="size-4" />
                                                    </button>
                                                    <button onClick={() => handleDeleteTerm(term.id)} className="btn btn-ghost btn-xs text-error">
                                                        <Trash2 className="size-4" />
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

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">{isEditMode ? 'Edit Term' : 'Add New Term'}</h2>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <form onSubmit={isEditMode ? handleUpdateTerm : handleCreateTerm} className="p-6 space-y-4">
                            <div>
                                <label className="label text-sm font-medium text-gray-700">Term Name *</label>
                                <input required type="text" name="name" value={formData.name} onChange={handleInputChange} className="input input-bordered w-full" placeholder="e.g. Term 1" />
                            </div>
                            <div>
                                <label className="label text-sm font-medium text-gray-700">Academic Year *</label>
                                <select required name="academic_year_id" value={formData.academic_year_id} onChange={handleInputChange} className="input input-bordered w-full">
                                    <option value="" disabled>Select Academic Year</option>
                                    {academicYears.map(year => (
                                        <option key={year.id} value={year.id}>{year.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label text-sm font-medium text-gray-700">Start Date</label>
                                    <input type="date" name="start_date" value={formData.start_date} onChange={handleInputChange} className="input input-bordered w-full" />
                                </div>
                                <div>
                                    <label className="label text-sm font-medium text-gray-700">End Date</label>
                                    <input type="date" name="end_date" value={formData.end_date} onChange={handleInputChange} className="input input-bordered w-full" />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" name="is_current" checked={formData.is_current} onChange={handleInputChange} className="checkbox checkbox-primary" />
                                <label className="label text-sm font-medium text-gray-700">Set as Current Term</label>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={closeModal} className="btn btn-ghost">Cancel</button>
                                <button type="submit" disabled={submitting} className="btn btn-primary">
                                    {submitting ? <span className="loading loading-spinner loading-sm"></span> : (isEditMode ? 'Update' : 'Save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
