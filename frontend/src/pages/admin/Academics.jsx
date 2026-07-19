import React, { useEffect, useState } from 'react';
import { Calendar, Plus, X, Edit2, Trash2 } from 'lucide-react';
import api from '../../api/client';
import toast from 'react-hot-toast';

export default function Academics() {
    const [years, setYears] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        start_date: '',
        end_date: '',
        is_current: false
    });
    const [submitting, setSubmitting] = useState(false);

    const fetchYears = async () => {
        try {
            const response = await api.get('/academic-years');
            setYears(response.data.data || []);
        } catch (error) {
            console.error("Failed to fetch academic years", error);
            toast.error("Failed to load academic years");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchYears();
    }, []);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    };

    const openCreateModal = () => {
        setIsEditMode(false);
        setEditingId(null);
        setFormData({ name: '', start_date: '', end_date: '', is_current: false });
        setIsModalOpen(true);
    };

    const openEditModal = (year) => {
        setIsEditMode(true);
        setEditingId(year.id);
        setFormData({
            name: year.name || '',
            start_date: year.start_date ? year.start_date.split('T')[0] : '',
            end_date: year.end_date ? year.end_date.split('T')[0] : '',
            is_current: year.is_current || false
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setIsEditMode(false);
        setEditingId(null);
        setFormData({ name: '', start_date: '', end_date: '', is_current: false });
    };

    const handleCreateYear = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/academic-years', formData);
            toast.success("Academic year created successfully");
            closeModal();
            fetchYears();
        } catch (error) {
            console.error("Error creating academic year", error);
            toast.error(error.response?.data?.error || "Failed to create academic year");
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateYear = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.put(`/academic-years/${editingId}`, formData);
            toast.success("Academic year updated successfully");
            closeModal();
            fetchYears();
        } catch (error) {
            console.error("Error updating academic year", error);
            toast.error(error.response?.data?.error || "Failed to update academic year");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteYear = async (id) => {
        if (!window.confirm('Are you sure you want to delete this academic year?')) return;
        try {
            await api.delete(`/academic-years/${id}`);
            toast.success("Academic year deleted successfully");
            fetchYears();
        } catch (error) {
            console.error("Error deleting academic year", error);
            toast.error(error.response?.data?.error || "Failed to delete academic year");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Academic Calendar</h1>
                    <p className="text-gray-500 text-sm">Manage academic years, terms, and dates.</p>
                </div>
                <button onClick={openCreateModal} className="flex gap-1 active:scale-95 items-center p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-md text-white shadow-lg">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Academic Year
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold mb-4">Academic Years</h3>
                
                {loading ? (
                    <div className="flex justify-center p-8"><span className="loading loading-spinner loading-lg"></span></div>
                ) : years.length === 0 ? (
                    <div className="text-center text-gray-500 py-4">No academic years found. Click "Add Academic Year" to create one.</div>
                ) : (
                    <div className="space-y-4">
                        {years.map((year) => (
                            <div key={year.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900">{year.name}</h4>
                                        <p className="text-sm text-gray-500">
                                            {new Date(year.start_date).toLocaleDateString()} - {new Date(year.end_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2 items-center">
                                    {year.is_current && <span className="badge badge-success">Current</span>}
                                    <button onClick={() => openEditModal(year)} className="btn btn-ghost btn-sm text-primary">
                                        <Edit2 className="size-4" />
                                    </button>
                                    <button onClick={() => handleDeleteYear(year.id)} className="btn btn-ghost btn-sm text-error">
                                        <Trash2 className="size-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">{isEditMode ? 'Edit Academic Year' : 'Add Academic Year'}</h2>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <form onSubmit={isEditMode ? handleUpdateYear : handleCreateYear} className="p-6 space-y-4">
                            <div>
                                <label className="label text-sm font-medium text-gray-700">Year Name *</label>
                                <input required type="text" name="name" value={formData.name} onChange={handleInputChange} className="input input-bordered w-full" placeholder="e.g. 2024-2025" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label text-sm font-medium text-gray-700">Start Date *</label>
                                    <input required type="date" name="start_date" value={formData.start_date} onChange={handleInputChange} className="input input-bordered w-full" />
                                </div>
                                <div>
                                    <label className="label text-sm font-medium text-gray-700">End Date *</label>
                                    <input required type="date" name="end_date" value={formData.end_date} onChange={handleInputChange} className="input input-bordered w-full" />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" name="is_current" checked={formData.is_current} onChange={handleInputChange} className="checkbox checkbox-primary" />
                                <label className="label text-sm font-medium text-gray-700">Set as Current Year</label>
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
