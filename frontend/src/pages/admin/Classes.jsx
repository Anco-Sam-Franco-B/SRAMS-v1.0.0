import React, { useEffect, useState } from 'react';
import { Layers, Plus, X, Edit2, Trash2 } from 'lucide-react';
import api from '../../api/client';
import toast from 'react-hot-toast';

export default function Classes() {
    const [classes, setClasses] = useState([]);
    const [trades, setTrades] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        level: '',
        capacity: '',
        trade_id: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const fetchClasses = async () => {
        try {
            const response = await api.get('/classes');
            setClasses(response.data.data || []);
        } catch (error) {
            console.error("Failed to fetch classes", error);
            toast.error("Failed to load classes");
        } finally {
            setLoading(false);
        }
    };

    const fetchTrades = async () => {
        try {
            const response = await api.get('/trades');
            setTrades(response.data.data || []);
        } catch (error) {
            console.error("Failed to fetch trades", error);
        }
    };

    useEffect(() => {
        fetchClasses();
        fetchTrades();
    }, []);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const openCreateModal = () => {
        setIsEditMode(false);
        setEditingId(null);
        setFormData({ name: '', level: '', capacity: '', trade_id: '' });
        setIsModalOpen(true);
    };

    const openEditModal = (cls) => {
        setIsEditMode(true);
        setEditingId(cls.id);
        setFormData({
            name: cls.name || '',
            level: cls.level || '',
            capacity: cls.capacity || '',
            trade_id: cls.trade_id || ''
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setIsEditMode(false);
        setEditingId(null);
        setFormData({ name: '', level: '', capacity: '', trade_id: '' });
    };

    const handleCreateClass = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = { ...formData };
            if (!payload.trade_id) delete payload.trade_id;
            if (!payload.capacity) delete payload.capacity;
            
            await api.post('/classes', payload);
            toast.success("Class created successfully");
            closeModal();
            fetchClasses();
        } catch (error) {
            console.error("Error creating class", error);
            toast.error(error.response?.data?.error || "Failed to create class");
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateClass = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = { ...formData };
            if (!payload.trade_id) delete payload.trade_id;
            if (!payload.capacity) delete payload.capacity;
            
            await api.put(`/classes/${editingId}`, payload);
            toast.success("Class updated successfully");
            closeModal();
            fetchClasses();
        } catch (error) {
            console.error("Error updating class", error);
            toast.error(error.response?.data?.error || "Failed to update class");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteClass = async (id) => {
        if (!window.confirm('Are you sure you want to delete this class?')) return;
        try {
            await api.delete(`/classes/${id}`);
            toast.success("Class deleted successfully");
            fetchClasses();
        } catch (error) {
            console.error("Error deleting class", error);
            toast.error(error.response?.data?.error || "Failed to delete class");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
                    <p className="text-gray-500 text-sm">Manage school classes and their associated trades.</p>
                </div>
                <button onClick={openCreateModal} className="flex gap-1 active:scale-95 items-center p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-md text-white shadow-lg">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Class
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-8"><span className="loading loading-spinner loading-lg"></span></div>
            ) : classes.length === 0 ? (
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center text-gray-500">
                    No classes found. Click "Add Class" to create one.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {classes.map((cls) => (
                        <div key={cls.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                    <Layers className="w-6 h-6" />
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => openEditModal(cls)} className="btn btn-ghost btn-xs text-primary">
                                        <Edit2 className="size-4" />
                                    </button>
                                    <button onClick={() => handleDeleteClass(cls.id)} className="btn btn-ghost btn-xs text-error">
                                        <Trash2 className="size-4" />
                                    </button>
                                </div>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">{cls.name}</h3>
                            <p className="text-sm text-gray-500 mb-4">{cls.trade_name || 'No Trade'}</p>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Level: {cls.level || 'N/A'}</span>
                                <span className="text-gray-500">Capacity: {cls.capacity || 'N/A'}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">{isEditMode ? 'Edit Class' : 'Add New Class'}</h2>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <form onSubmit={isEditMode ? handleUpdateClass : handleCreateClass} className="p-6 space-y-4">
                            <div>
                                <label className="label text-sm font-medium text-gray-700">Class Name *</label>
                                <input required type="text" name="name" value={formData.name} onChange={handleInputChange} className="input input-bordered w-full" placeholder="e.g. Senior 1" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label text-sm font-medium text-gray-700">Level *</label>
                                    <input required type="text" name="level" value={formData.level} onChange={handleInputChange} className="input input-bordered w-full" placeholder="e.g. 1" />
                                </div>
                                <div>
                                    <label className="label text-sm font-medium text-gray-700">Capacity</label>
                                    <input type="number" name="capacity" value={formData.capacity} onChange={handleInputChange} className="input input-bordered w-full" placeholder="e.g. 40" />
                                </div>
                            </div>
                            <div>
                                <label className="label text-sm font-medium text-gray-700">Trade/Department</label>
                                <select name="trade_id" value={formData.trade_id} onChange={handleInputChange} className="input input-bordered w-full">
                                    <option value="">No Trade</option>
                                    {trades.map(trade => (
                                        <option key={trade.id} value={trade.id}>{trade.name} ({trade.code})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={closeModal} className="btn btn-ghost">Cancel</button>
                                <button type="submit" disabled={submitting} className="btn btn-primary">
                                    {submitting ? <span className="loading loading-spinner loading-sm"></span> : (isEditMode ? 'Update Class' : 'Save Class')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
