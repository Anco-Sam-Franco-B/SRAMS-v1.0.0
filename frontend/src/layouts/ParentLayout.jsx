import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, BarChart3, CheckSquare, FileText, Bell, User, LogOut } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useNotificationStore from '../store/notificationStore';
import Avatar from '../components/ui/Avatar';

const navItems = [
  { to: '/parent/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/parent/children', icon: Users, label: 'My Children' },
  { to: '/parent/marks', icon: BarChart3, label: 'Marks' },
  { to: '/parent/attendance', icon: CheckSquare, label: 'Attendance' },
  { to: '/parent/report-cards', icon: FileText, label: 'Report Cards' },
  { to: '/parent/notifications', icon: Bell, label: 'Notifications' },
  { to: '/parent/profile', icon: User, label: 'Profile' },
];

export default function ParentLayout() {
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();

  return (
    <div className="flex h-screen bg-surface-50 dark:bg-surface-950">
      <aside className="hidden lg:flex w-64 bg-white dark:bg-surface-900 border-r border-surface-100 dark:border-surface-800 flex-col">
        <div className="px-6 py-5 border-b border-surface-100 dark:border-surface-800">
          <h1 className="text-xl font-bold gradient-text">SRAMS</h1>
          <p className="text-xs text-gray-400 mt-0.5">Parent Portal</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400' : 'text-gray-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800'}`}>
              <item.icon className="w-5 h-5" />
              {item.label}
              {item.label === 'Notifications' && unreadCount > 0 && <span className="ml-auto bg-red-500 text-white text-2xs px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-surface-100 dark:border-surface-800">
          <button onClick={logout} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-surface-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 w-full transition-all">
            <LogOut className="w-5 h-5" />Logout
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white dark:bg-surface-900 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between px-6">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-surface-100">Parent Portal</h2>
          <div className="flex items-center gap-3">
            <Avatar name={user?.first_name || 'P'} size="sm" />
            <span className="text-sm font-medium text-gray-700 dark:text-surface-300">{user?.first_name} {user?.last_name}</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6"><Outlet /></main>
      </div>
    </div>
  );
}
