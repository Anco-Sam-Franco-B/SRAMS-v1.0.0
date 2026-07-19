import React, { useEffect, useState } from 'react';
import { BookOpen, Search, X, Briefcase, Plus, Trash2, LoaderPinwheelIcon, Edit2 } from 'lucide-react';
import api from '../../api/client';
import toast from 'react-hot-toast';

export default function Teachers() {
    const [teachers, setTeachers] = useState([]);
    const [trades, setTrades] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [classes, setClasses] = useState([]);
    const [allocations, setAllocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAddTeacherModal, setIsAddTeacherModal] = useState(false);
    const [isEditModal, setIsEditModal] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState(null);
    
    // Add Teacher form state
    const [addTeacherForm, setAddTeacherForm] = useState({
        user_id: '',
        trade_id: ''
    });

    // Edit Teacher form state
    const [editTeacherForm, setEditTeacherForm] = useState({
        trade_id: ''
    });
    
    // Assignment form state
    const [primaryTrade, setPrimaryTrade] = useState('');
    const [allocationForm, setAllocationForm] = useState({
        trade_id: '',
        class_id: '',
        subject_id: ''
    });
    const [saving, setSaving] = useState(false);

    // Users for teacher assignment
    const [users, setUsers] = useState([]);

    const fetchData = async () => {
        try {
            const [techRes, tradesRes, subRes, classRes, allocRes, usersRes] = await Promise.all([
                api.get('/teachers'),
                api.get('/trades'),
                api.get('/subjects'),
                api.get('/classes'),
                api.get('/teacher-subjects'),
                api.get('/users')
            ]);
            setTeachers(techRes.data.data || []);
            setTrades(tradesRes.data.data || []);
            setSubjects(subRes.data.data || []);
            setClasses(classRes.data.data || []);
            setAllocations(allocRes.data.data || []);
            setUsers(usersRes.data.data || []);
        } catch (error) {
            console.error("Failed to fetch data", error);
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const openManageModal = (teacher) => {
        setSelectedTeacher(teacher);
        setPrimaryTrade(teacher.trade_id || '');
        setIsModalOpen(true);
    };

    const openAddTeacherModal = () => {
        setAddTeacherForm({ user_id: '', trade_id: '' });
        setIsAddTeacherModal(true);
    };

    const openEditModal = (teacher) => {
        setEditingTeacher(teacher);
        setEditTeacherForm({ trade_id: teacher.trade_id || '' });
        setIsEditModal(true);
    };

    const handleAddTeacher = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = { ...addTeacherForm };
            if (!payload.trade_id) delete payload.trade_id;
            if (!payload.user_id) delete payload.user_id;
            
            await api.post('/teachers', payload);
            toast.success("Teacher added successfully");
            setIsAddTeacherModal(false);
            fetchData();
        } catch (error) {
            console.error("Error adding teacher", error);
            toast.error(error.response?.data?.error || "Failed to add teacher");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteTeacher = async (teacherId) => {
        if (!window.confirm('Delete this teacher? This action cannot be undone.')) return;
        try {
            await api.delete(`/teachers/${teacherId}`);
            toast.success("Teacher deleted successfully");
            fetchData();
        } catch (error) {
            console.error('Error deleting teacher', error);
            toast.error(error.response?.data?.error || 'Failed to delete teacher');
        }
    };

    const handleUpdateTeacher = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put(`/teachers/${editingTeacher.id}`, editTeacherForm);
            toast.success("Teacher updated successfully");
            setIsEditModal(false);
            fetchData();
        } catch (error) {
            console.error("Error updating teacher", error);
            toast.error("Failed to update teacher");
        } finally {
            setSaving(false);
        }
    };

    const handleUpdatePrimaryTrade = async () => {
        setSaving(true);
        try {
            await api.put(`/teachers/${selectedTeacher.id}`, { trade_id: primaryTrade });
            fetchData();
            toast.success("Primary trade updated successfully!");
        } catch (error) {
            console.error("Error updating trade", error);
            toast.error("Failed to update trade");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAllocation = async (allocation) => {
        if (!window.confirm('Delete this allocation?')) return;
        try {
            await api.delete(`/teacher-subjects/${allocation.teacher_id}/${allocation.subject_id}/${allocation.class_id}`);
            fetchData();
            toast.success("Allocation deleted successfully");
        } catch (error) {
            console.error("Error deleting allocation", error);
            toast.error(error.response?.data?.error || "Failed to delete allocation");
        }
    };

    const handleAddAllocation = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post('/teacher-subjects', {
                teacher_id: selectedTeacher.id,
                trade_id: allocationForm.trade_id,
                class_id: allocationForm.class_id,
                subject_id: allocationForm.subject_id
            });
            setAllocationForm({ trade_id: '', class_id: '', subject_id: '' });
            fetchData();
            toast.success("Allocation added successfully");
        } catch (error) {
            console.error("Error adding allocation", error);
            toast.error(error.response?.data?.error || "Failed to add allocation");
        } finally {
            setSaving(false);
        }
    };

    // Get allocations specific to the selected teacher
    const teacherAllocations = selectedTeacher 
        ? allocations.filter(a => a.teacher_id === selectedTeacher.id)
        : [];

    // Filter teachers
    const filteredTeachers = teachers.filter(teacher => {
        return searchTerm === '' || 
            teacher.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            teacher.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            teacher.email?.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Teachers Management</h1>
                    <p className="text-gray-500 text-sm">Manage teaching staff and cross-trade subject allocations.</p>
                </div>
                <button onClick={openAddTeacherModal} className="flex gap-1 active:scale-95 items-center p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-md text-white shadow-lg">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Teacher
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div className="relative">
                        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input 
                            type="text" 
                            placeholder="Search teachers..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 w-64"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex justify-center p-8"><span className="loading loading-spinner loading-lg"></span></div>
                    ) : (
                        <table className="table w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500">
                                    <th className='p-3'>Name</th>
                                    <th className='p-3'>Email</th>
                                    <th className='p-3'>Primary Trade</th>
                                    <th className='p-3'>Status</th>
                                    <th className='p-3'>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTeachers.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="text-center py-8 text-gray-500">No teachers found.</td>
                                    </tr>
                                ) : (
                                    filteredTeachers.map((teacher) => (
                                        <tr key={teacher.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="font-medium text-gray-900 p-3 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-md shadow-md">
                                                    {`${teacher.first_name?.charAt(0)}${teacher.last_name?.charAt(0)}`.toUpperCase()}
                                                </div>
                                                {teacher.first_name} {teacher.last_name}
                                            </td>
                                            <td className='p-3'>{teacher.email || 'N/A'}</td>
                                            <td className='p-3'>
                                                {teacher.trade_name ? (
                                                    <span className="badge badge-primary badge-outline badge-sm">{teacher.trade_name}</span>
                                                ) : (
                                                    <span className="text-gray-400 text-sm">Unassigned</span>
                                                )}
                                            </td>
                                            <td className='p-3'>
                                                <span className={`${teacher.is_active ? 'bg-green-100 px-2 font-medium rounded-full text-green-600' : 'bg-red-100 px-2 font-medium rounded-full text-red-600'} badge-sm`}>
                                                    {teacher.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className='p-3 flex items-center gap-2'>
                                                <button onClick={() => openManageModal(teacher)} className="flex items-center p-2 bg-blue-600 text-white rounded-lg shadow-lg">
                                                    <Briefcase className="w-3 h-3 mr-1" />
                                                    Manage
                                                </button>
                                                <button onClick={() => openEditModal(teacher)} className="btn btn-ghost btn-xs text-primary">
                                                    <Edit2 className="size-4" />
                                                </button>
                                                <button onClick={() => handleDeleteTeacher(teacher.id)} className="btn btn-ghost btn-xs text-error">
                                                    <Trash2 className="size-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Add Teacher Modal */}
            {isAddTeacherModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">Add New Teacher</h2>
                            <button onClick={() => setIsAddTeacherModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleAddTeacher} className="p-6 space-y-4">
                            <div>
                                <label className="label text-sm font-medium text-gray-700">Select User *</label>
                                <select required value={addTeacherForm.user_id} onChange={(e) => setAddTeacherForm({...addTeacherForm, user_id: e.target.value})} className="appearance-none w-full bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl px-4 py-1.5 shadow-sm cursor-pointer transition-all duration-200 hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
                                    <option value="" disabled>Select User</option>
                                    {users.filter(u => !teachers.find(t => t.user_id === u.id)).map(user => (
                                        <option key={user.id} value={user.id}>{user.first_name} {user.last_name} ({user.email})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="label text-sm font-medium text-gray-700">Primary Trade</label>
                                <select value={addTeacherForm.trade_id} onChange={(e) => setAddTeacherForm({...addTeacherForm, trade_id: e.target.value})} className="appearance-none w-full bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl px-4 py-1.5 shadow-sm cursor-pointer transition-all duration-200 hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
                                    <option value="">No Trade</option>
                                    {trades.map(t => (
                                        <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsAddTeacherModal(false)} className="btn btn-ghost">Cancel</button>
                                <button type="submit" disabled={saving} className="btn btn-primary">
                                    {saving ? <span className="loading loading-spinner loading-sm"></span> : 'Add Teacher'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Teacher Modal */}
            {isEditModal && editingTeacher && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">Edit Teacher: {editingTeacher.first_name} {editingTeacher.last_name}</h2>
                            <button onClick={() => setIsEditModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateTeacher} className="p-6 space-y-4">
                            <div>
                                <label className="label text-sm font-medium text-gray-700">Primary Trade</label>
                                <select value={editTeacherForm.trade_id} onChange={(e) => setEditTeacherForm({...editTeacherForm, trade_id: e.target.value})} className="appearance-none w-full bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl px-4 py-1.5 shadow-sm cursor-pointer transition-all duration-200 hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
                                    <option value="">No Trade</option>
                                    {trades.map(t => (
                                        <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsEditModal(false)} className="btn btn-ghost">Cancel</button>
                                <button type="submit" disabled={saving} className="btn btn-primary">
                                    {saving ? <span className="loading loading-spinner loading-sm"></span> : 'Update Teacher'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Allocation Management Modal */}
            {isModalOpen && selectedTeacher && (
                <div className="fixed -top-6 h-screen inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-xl max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Manage Teacher: {selectedTeacher.first_name} {selectedTeacher.last_name}</h2>
                                <p className="text-sm text-gray-500">Assign to trades and classes across different levels</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost btn-circle btn-sm">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1 space-y-8">
                            {/* Section 1: Primary Trade Assignment */}
                            <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100">
                                <h3 className="text-sm font-bold text-blue-900 mb-3">1. Primary Trade Department</h3>
                                <div className="flex gap-3">
                                    <select 
                                        className="appearance-none w-[510px] bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl px-4 py-1.5 shadow-sm cursor-pointer transition-all duration-200 hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" 
                                        value={primaryTrade} 
                                        onChange={(e) => setPrimaryTrade(e.target.value)}
                                    >
                                        <option value="">No Primary Trade</option>
                                        {trades.map(t => <option key={t.id} value={t.id}>{t.name} ({t.code})</option>)}
                                    </select>
                                    <button onClick={handleUpdatePrimaryTrade} disabled={saving} className="flex items-center p-2 gap-2 bg-blue-600 text-white rounded-lg shadow-lg text-sm">
                                        {saving ? (<><LoaderPinwheelIcon className='size-5 animate-spin'/> Updating....</>) : 'Update Department'}
                                    </button>
                                </div>
                            </div>

                            {/* Section 2: Subject & Class Allocations */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center border-b pb-2">
                                    <BookOpen className="w-4 h-4 mr-2 text-primary" />
                                    2. Cross-Class Subject Allocations (teacher_subjects)
                                </h3>
                                
                                {/* Current Allocations Table */}
                                <div className="mb-6 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                                    <table className="table w-full table-sm">
                                        <thead className="bg-gray-100 text-gray-600">
                                            <tr>
                                                <th>Trade</th>
                                                <th>Class/Level</th>
                                                <th>Subject</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {teacherAllocations.length === 0 ? (
                                                <tr>
                                                    <td colSpan="4" className="text-center py-4 text-gray-400">No classes assigned yet.</td>
                                                </tr>
                                            ) : (
                                                teacherAllocations.map((alloc, idx) => {
                                                    const trd = trades.find(t => t.id === alloc.trade_id);
                                                    const cls = classes.find(c => c.id === alloc.class_id);
                                                    const sub = subjects.find(s => s.id === alloc.subject_id);
                                                    return (
                                                        <tr key={idx}>
                                                            <td className='px-2 py-2'>{trd?.name || 'N/A'}</td>
                                                            <td className="font-medium px-2 py-2">{cls?.name || 'N/A'} {cls?.level ? `(${cls.level})` : ''}</td>
                                                            <td className='px-2 py-2'>{sub?.name || 'N/A'}</td>
                                                            <td className="px-2 py-2">
                                                                <button onClick={() => handleDeleteAllocation(alloc)} className="btn btn-ghost btn-xs text-error"><Trash2 className="size-4 text-red-600" /></button>
                                                            </td>
                                                        </tr>
                                                    )
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Add New Allocation Form */}
                                <form onSubmit={handleAddAllocation} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Assign New Class & Subject</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                                        <div>
                                            <label className="label text-xs font-medium py-1">Trade Program *</label>
                                            <select required className="appearance-none w-full bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl px-4 py-1.5 shadow-sm cursor-pointer transition-all duration-200 hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" value={allocationForm.trade_id} onChange={(e) => setAllocationForm({...allocationForm, trade_id: e.target.value})}>
                                                <option value="" disabled>Select Trade</option>
                                                {trades.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="label text-xs font-medium py-1">Class/Level *</label>
                                            <select required className="appearance-none w-full bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl px-4 py-1.5 shadow-sm cursor-pointer transition-all duration-200 hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" value={allocationForm.class_id} onChange={(e) => setAllocationForm({...allocationForm, class_id: e.target.value})}>
                                                <option value="" disabled>Select Class</option>
                                                {classes.filter(c => c.trade_id === allocationForm.trade_id || !allocationForm.trade_id).map(c => <option key={c.id} value={c.id}>{c.name} {c.level ? `(${c.level})` : ''}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="label text-xs font-medium py-1">Subject *</label>
                                            <select required className="appearance-none w-full bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl px-4 py-1.5 shadow-sm cursor-pointer transition-all duration-200 hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" value={allocationForm.subject_id} onChange={(e) => setAllocationForm({...allocationForm, subject_id: e.target.value})}>
                                                <option value="" disabled>Select Subject</option>
                                                {subjects.filter(s => s.trade_id === allocationForm.trade_id || !allocationForm.trade_id || !s.trade_id).map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex justify-end mt-2">
                                        <button type="submit" disabled={saving || !allocationForm.trade_id || !allocationForm.class_id || !allocationForm.subject_id} className="flex items-center p-2 bg-blue-600 text-white rounded-lg shadow-lg">
                                            <Plus className="w-3 h-3 mr-1" /> Add Allocation
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
