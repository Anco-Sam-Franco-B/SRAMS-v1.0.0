import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../store/authStore';
import { useTheme } from '../context/ThemeContext';
import Avatar from '../components/ui/Avatar';
import {
  LayoutDashboard, CheckSquare, BarChart3, Users,
  ClipboardList, User, LogOut, GraduationCap, Menu, X, Sun, Moon, Bell, ChevronLeft
} from 'lucide-react';

const navItems = [
  { path: '/teacher/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/teacher/attendance', icon: CheckSquare, label: 'Attendance' },
  { path: '/teacher/marks', icon: BarChart3, label: 'Marks Entry' },
  { path: '/teacher/classes', icon: Users, label: 'My Classes' },
  { path: '/teacher/assessments', icon: ClipboardList, label: 'Assessments' },
  { path: '/teacher/profile', icon: User, label: 'Profile' },
];

export default function TeacherLayout() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = async () => { await logout(); navigate('/login'); };

  return (
    <div className="flex h-screen bg-surface-50 dark:bg-surface-950 overflow-hidden">
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden" onClick={() => setMobileOpen(false)} />
        )}
      </AnimatePresence>

      <aside className={`${collapsed ? 'w-[72px]' : 'w-64'} bg-white dark:bg-surface-900 border-r border-surface-100 dark:border-surface-800 flex flex-col fixed inset-y-0 left-0 z-50 transition-all duration-300 md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="h-16 flex items-center px-4 border-b border-surface-100 dark:border-surface-800">
          <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-glow">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="ml-3">
              <span className="text-xl font-bold text-surface-900 dark:text-surface-100 tracking-tight font-display">SRAMS</span>
              <p className="text-[10px] text-surface-400 -mt-0.5">Teacher Portal</p>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="ml-auto p-1.5 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors hidden md:flex">
            <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {navItems.map(item => (
            <NavLink key={item.path} to={item.path} title={collapsed ? item.label : ''}
              className={({ isActive }) => `flex items-center ${collapsed ? 'justify-center px-2' : 'px-3'} py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20' : 'text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-100'
              }`}>
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="ml-3">{item.label}</span>}
            </NavLink>
          ))}
        </div>

        <div className="px-2 py-3 border-t border-surface-100 dark:border-surface-800">
          <button onClick={handleLogout} title={collapsed ? 'Logout' : ''}
            className={`w-full flex items-center ${collapsed ? 'justify-center px-2' : 'px-3'} py-2.5 rounded-xl text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all duration-200`}>
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="ml-3">Logout</span>}
          </button>
        </div>
      </aside>

      <div className={`flex-1 flex flex-col h-screen overflow-hidden ${collapsed ? 'md:ml-[72px]' : 'md:ml-64'} transition-all duration-300`}>
        <header className="h-16 bg-white/80 dark:bg-surface-900/80 backdrop-blur-xl border-b border-surface-100 dark:border-surface-800 flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 rounded-xl text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-lg font-bold text-surface-900 dark:text-surface-100 hidden md:block font-display">Teacher Portal</span>
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
                <p className="text-sm font-medium text-surface-900 dark:text-surface-100">{user?.first_name} {user?.last_name}</p>
                <p className="text-xs text-surface-500">Teacher</p>
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
