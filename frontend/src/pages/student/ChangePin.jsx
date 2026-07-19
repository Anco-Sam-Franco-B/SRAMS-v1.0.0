import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import api from '../../api/client';
import toast from 'react-hot-toast';

export default function ChangePin() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    current_pin: '',
    new_pin: '',
    confirm_pin: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.current_pin) newErrors.current_pin = 'Current PIN is required';
    if (!formData.new_pin) newErrors.new_pin = 'New PIN is required';
    else if (formData.new_pin.length < 4) newErrors.new_pin = 'PIN must be at least 4 digits';
    if (!formData.confirm_pin) newErrors.confirm_pin = 'Please confirm your new PIN';
    else if (formData.new_pin !== formData.confirm_pin) newErrors.confirm_pin = 'PINs do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await api.put(`/students/${user?.studentId || user?.id}/pin`, {
        current_pin: formData.current_pin,
        new_pin: formData.new_pin,
      });
      toast.success('PIN changed successfully');
      navigate('/student/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change PIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Change PIN</h1>
        <p className="text-gray-500 text-sm">Update your login PIN for security.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Current PIN</label>
          <input
            type="password"
            name="current_pin"
            value={formData.current_pin}
            onChange={handleChange}
            maxLength={6}
            className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
              errors.current_pin ? 'border-red-300' : 'border-gray-200'
            }`}
            placeholder="Enter current PIN"
          />
          {errors.current_pin && <p className="text-red-500 text-xs mt-1">{errors.current_pin}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">New PIN</label>
          <input
            type="password"
            name="new_pin"
            value={formData.new_pin}
            onChange={handleChange}
            maxLength={6}
            className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
              errors.new_pin ? 'border-red-300' : 'border-gray-200'
            }`}
            placeholder="Enter new PIN (min 4 digits)"
          />
          {errors.new_pin && <p className="text-red-500 text-xs mt-1">{errors.new_pin}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Confirm New PIN</label>
          <input
            type="password"
            name="confirm_pin"
            value={formData.confirm_pin}
            onChange={handleChange}
            maxLength={6}
            className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
              errors.confirm_pin ? 'border-red-300' : 'border-gray-200'
            }`}
            placeholder="Confirm new PIN"
          />
          {errors.confirm_pin && <p className="text-red-500 text-xs mt-1">{errors.confirm_pin}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Changing PIN...' : 'Change PIN'}
        </button>
      </form>
    </div>
  );
}
