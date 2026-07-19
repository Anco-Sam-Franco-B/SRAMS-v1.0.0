import { useState } from 'react';
import { Lock, Eye, EyeOff, Loader2, GraduationCap, CheckCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import api from '../../api/client';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const getPasswordStrength = (password) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const strength = getPasswordStrength(form.password);
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-emerald-500'];
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.password || !form.confirmPassword) return toast.error('Both fields are required');
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters');
    if (!token) return toast.error('Invalid reset token');

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password: form.password });
      setSuccess(true);
      toast.success('Password reset successful');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-surface-950 dark:to-surface-900 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-surface-900 rounded-2xl shadow-elevated p-8 border border-surface-100 dark:border-surface-800">
            <div className="text-center mb-8">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
                <GraduationCap className="w-7 h-7 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Reset Password</h2>
              <p className="text-surface-500 dark:text-surface-400 mt-2 text-sm">Enter your new password below.</p>
            </div>

            {success ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100 mb-2">Password Reset!</h3>
                <p className="text-sm text-surface-500 dark:text-surface-400 mb-6">Your password has been successfully reset.</p>
                <button
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"
                >
                  Go to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">New Password</label>
                  <div className="flex items-center border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 transition-all">
                    <Lock className="text-surface-400" size={20} />
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="ml-3 w-full bg-transparent outline-none text-surface-900 dark:text-surface-100"
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-surface-400">
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {form.password && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[0, 1, 2, 3, 4].map(i => (
                          <div key={i} className={`h-1 flex-1 rounded-full ${i < strength ? strengthColors[strength - 1] : 'bg-surface-200 dark:bg-surface-700'}`} />
                        ))}
                      </div>
                      <p className="text-xs text-surface-500">{strength > 0 ? strengthLabels[strength - 1] : ''}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Confirm Password</label>
                  <div className="flex items-center border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 transition-all">
                    <Lock className="text-surface-400" size={20} />
                    <input
                      name="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={form.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="ml-3 w-full bg-transparent outline-none text-surface-900 dark:text-surface-100"
                      required
                    />
                  </div>
                  {form.confirmPassword && form.password !== form.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white rounded-xl py-3 font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
