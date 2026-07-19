import React, { useEffect, useState } from 'react';
import useAuthStore from '../../store/authStore';
import api from '../../api/client';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, setUser } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ phone: '', email: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get(`/students/${user?.studentId || user?.id}`);
        const data = response.data.student || response.data;
        setProfile(data);
        setFormData({ phone: data.phone || '', email: data.email || '' });
      } catch (error) {
        console.error('Failed to fetch profile', error);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchData();
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/students/${user?.studentId || user?.id}`, {
        phone: formData.phone,
        email: formData.email,
      });
      setProfile({ ...profile, phone: formData.phone, email: formData.email });
      if (user) {
        setUser({ ...user, phone: formData.phone, email: formData.email });
      }
      setEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { label: 'First Name', value: profile?.first_name },
    { label: 'Last Name', value: profile?.last_name },
    { label: 'Admission No', value: profile?.admission_no },
    { label: 'Email', value: profile?.email, key: 'email' },
    { label: 'Phone', value: profile?.phone, key: 'phone' },
    { label: 'Gender', value: profile?.gender },
    { label: 'Nationality', value: profile?.nationality },
    { label: 'Date of Birth', value: profile?.dob || profile?.date_of_birth },
    { label: 'Class', value: profile?.class_name },
    { label: 'Trade', value: profile?.trade },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                <div className="h-10 w-full bg-gray-100 rounded-xl animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-500 text-sm">View and manage your personal information.</p>
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => { setEditing(false); setFormData({ phone: profile?.phone || '', email: profile?.email || '' }); }}
              className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fields.map((field) => (
            <div key={field.label}>
              <label className="text-sm font-medium text-gray-500 mb-1 block">{field.label}</label>
              {editing && field.key ? (
                <input
                  type={field.key === 'email' ? 'email' : 'tel'}
                  name={field.key}
                  value={formData[field.key]}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              ) : (
                <p className="text-gray-900 font-medium py-2.5">{field.value || '--'}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
