import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../store/authStore';
import { useTheme } from '../context/ThemeContext';
import Avatar from '../components/ui/Avatar';
import {
  GraduationCap, LayoutDashboard, BarChart3, CheckSquare,
  FileText, ClipboardList, User, Lock, LogOut, Menu, X, Sun, Moon, Bell
} from 'lucide-react';

const navItems = [
  { path: '/student/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/student/marks', icon: BarChart3, label: 'My Marks' },
  { path: '/student/attendance', icon: CheckSquare, label: 'Attendance' },
  { path: '/student/report-card', icon: FileText, label: 'Report Cards' },
  { path: '/student/assessments', icon: ClipboardList, label: 'Assessments' },
  { path: '/student/profile', icon: User, label: 'Profile' },
  { path: '/student/change-pin', icon: Lock, label: 'Change PIN' },
];

export default function StudentLayout() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  const handleLogout = async () => { await logout(); navigate('/login'); };

  return (
    <div className="flex h-screen bg-surface-50 dark:bg-surface-950 overflow-hidden">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}
      </AnimatePresence>

      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-surface-900 border-r border-surface-100 dark:border-surface-800 flex flex-col transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="h-16 flex items-center px-4 border-b border-surface-100 dark:border-surface-800">
          <div className="w-9 h-9 bg-gradient-to-br from-accent-500 to-accent-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-glow">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div className="ml-3">
            <span className="text-xl font-bold text-surface-900 dark:text-surface-100 tracking-tight font-display">SRAMS</span>
            <p className="text-[10px] text-surface-400 -mt-0.5">Student Portal</p>
          </div>
          <button className="ml-auto md:hidden p-1.5 rounded-lg text-surface-400 hover:text-surface-600" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
          {navItems.map(item => (
            <NavLink key={item.path} to={item.path}
              className={({ isActive }) => `flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20' : 'text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-100'
              }`}>
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="ml-3">{item.label}</span>
            </NavLink>
          ))}
        </div>

        <div className="p-2 border-t border-surface-100 dark:border-surface-800">
          <button onClick={handleLogout}
            className="w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all duration-200">
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="ml-3">Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white/80 dark:bg-surface-900/80 backdrop-blur-xl border-b border-surface-100 dark:border-surface-800 flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-xl text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-lg font-bold text-surface-900 dark:text-surface-100 hidden md:block font-display">Student Portal</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="p-2 rounded-xl text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button className="relative p-2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-xl transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-surface-900"></span>
            </button>
            <div className="h-8 w-px bg-surface-200 dark:bg-surface-700 mx-1"></div>
            <div className="flex items-center gap-3">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-surface-900 dark:text-surface-100">{user?.first_name || 'Student'}</p>
                <p className="text-xs text-surface-500">{user?.admission_no || ''}</p>
              </div>
              <Avatar name={`${user?.first_name} ${user?.last_name}`} size="sm" />
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-surface-50 dark:bg-surface-950 p-6">
          <div className="max-w-7xl mx-auto"><Outlet /></div>
        </main>
      </div>
    </div>
  );
}
