import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle, GraduationCap } from 'lucide-react';
import api from '../../api/client';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }
    api.post('/auth/verify-email', { token })
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-surface-950 dark:to-surface-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-surface-900 rounded-2xl shadow-elevated p-8 border border-surface-100 dark:border-surface-800 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
            <GraduationCap className="w-7 h-7 text-primary-600 dark:text-primary-400" />
          </div>

          {status === 'loading' && (
            <>
              <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-surface-900 dark:text-surface-100">Verifying Email...</h2>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-surface-900 dark:text-surface-100 mb-2">Email Verified!</h2>
              <p className="text-sm text-surface-500 dark:text-surface-400 mb-6">Your email has been verified successfully.</p>
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                Go to Login
              </button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-surface-900 dark:text-surface-100 mb-2">Verification Failed</h2>
              <p className="text-sm text-surface-500 dark:text-surface-400 mb-6">The verification link is invalid or has expired.</p>
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                Go to Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
