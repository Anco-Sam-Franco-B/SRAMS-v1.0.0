import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Shield } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import api from '../../api/client';

export default function TwoFactorVerify() {
  const navigate = useNavigate();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef([]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    if (newCode.every(d => d) && newCode.join('').length === 6) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (codeStr) => {
    setLoading(true);
    try {
      await api.post('/auth/verify-2fa', { code: codeStr });
      toast.success('Verification successful');
      navigate('/admin/dashboard');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Invalid code');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await api.post('/auth/send-otp', { type: '2fa' });
      toast.success('New code sent to your email');
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) { clearInterval(timer); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      toast.error('Failed to resend code');
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-surface-950 dark:to-surface-900 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-surface-900 rounded-2xl shadow-elevated p-8 border border-surface-100 dark:border-surface-800 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
              <Shield className="w-7 h-7 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-2xl font-bold text-surface-900 dark:text-surface-100 mb-2">Two-Factor Authentication</h2>
            <p className="text-sm text-surface-500 dark:text-surface-400 mb-8">
              Enter the 6-digit code sent to your email.
            </p>

            <div className="flex justify-center gap-2 mb-6">
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={el => inputRefs.current[i] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-12 h-14 text-center text-xl font-bold border border-surface-200 dark:border-surface-700 rounded-xl bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                />
              ))}
            </div>

            <button
              onClick={() => handleVerify(code.join(''))}
              disabled={loading || code.some(d => !d)}
              className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white rounded-xl py-3 font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {loading ? 'Verifying...' : 'Verify'}
            </button>

            <button
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
