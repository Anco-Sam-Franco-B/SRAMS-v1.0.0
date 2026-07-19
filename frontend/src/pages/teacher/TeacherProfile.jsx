import React, { useEffect, useState } from 'react';
import { User, Mail, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import useAuthStore from '../../store/authStore';

export default function TeacherProfile() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileRes = await api.get('/teachers/profile');
        const profileData = profileRes.data.data || profileRes.data || {};
        setProfile(profileData);
        
        // Fetch assignments using the teacher ID from the profile
        if (profileData.id) {
          const assignRes = await api.get(`/teachers/${profileData.id}/assignments`);
          setAssignments(assignRes.data.data || assignRes.data || []);
        }
      } catch {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchProfile();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-40 bg-white rounded-xl border border-gray-100 animate-pulse" />
        <div className="h-64 bg-white rounded-xl border border-gray-100 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 text-sm">Your account information and assignments.</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-2xl font-bold">
            {profile?.first_name?.charAt(0) || user?.first_name?.charAt(0) || 'T'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {profile?.first_name} {profile?.last_name}
            </h2>
            <p className="text-sm text-gray-500">{profile?.email || user?.email}</p>
            {profile?.trade && (
              <span className="inline-block mt-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                {profile.trade.name}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <User className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Full Name</p>
              <p className="text-sm font-medium text-gray-900">{profile?.first_name} {profile?.last_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <Mail className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Email</p>
              <p className="text-sm font-medium text-gray-900">{profile?.email || '-'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Trade</p>
              <p className="text-sm font-medium text-gray-900">{profile?.trade?.name || '-'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Assignments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Assigned Classes & Subjects</h3>
        </div>
        {assignments.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            No assignments found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Class</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Trade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {assignments.map((a, i) => (
                  <tr key={a.id || i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {a.class?.name || a.class_name || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {a.subject?.name || a.subject_name || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {a.trade?.name || a.trade_name || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
