import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { Loader2 } from 'lucide-react';

const getDashboardPath = (role) => {
  switch (role) {
    case 'Administrator':
    case 'School Administrator':
    case 'Head Teacher':
    case 'Deputy Head Teacher':
    case 'Director of Studies':
    case 'Examination Officer':
    case 'Registrar':
      return '/admin/dashboard';
    case 'Teacher':
    case 'Class Teacher':
      return '/teacher/dashboard';
    case 'Student':
      return '/student/dashboard';
    case 'Parent':
      return '/parent/dashboard';
    default:
      return '/login';
  }
};

export default function PublicRoute() {
  const { user, loading, fetchCurrentUser } = useAuthStore();

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-50 dark:bg-surface-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          <p className="text-surface-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return <Outlet />;
}
