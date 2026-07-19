import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../store/authStore';
import { useTheme } from '../context/ThemeContext';
import Avatar from '../components/ui/Avatar';
import {
  LayoutDashboard, Users, GraduationCap, Layers, BookOpen,
  Calendar, CheckSquare, FileSpreadsheet, Settings, Database,
  LogOut, Bell, Search, Menu, X, ArrowUpRight, Sun, Moon, ChevronLeft,
  Target, Send, HelpCircle, ClipboardCheck
} from 'lucide-react';

const menuSections = [
  {
    title: 'Main',
    items: [
      { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    title: 'Management',
    items: [
      { path: '/admin/users', icon: Users, label: 'System Users' },
      { path: '/admin/students', icon: Users, label: 'Students' },
      { path: '/admin/teachers', icon: GraduationCap, label: 'Teachers' },
      { path: '/admin/teacher-allocations', icon: GraduationCap, label: 'Allocations' },
      { path: '/admin/classes', icon: Layers, label: 'Classes' },
      { path: '/admin/subjects', icon: BookOpen, label: 'Subjects' },
    ],
  },
  {
    title: 'Academic',
    items: [
      { path: '/admin/academics', icon: Calendar, label: 'Years' },
      { path: '/admin/terms', icon: Calendar, label: 'Terms' },
      { path: '/admin/attendance', icon: CheckSquare, label: 'Attendance' },
      { path: '/admin/assessments', icon: ClipboardCheck, label: 'Assessments' },
      { path: '/admin/marks', icon: FileSpreadsheet, label: 'Marks' },
      { path: '/admin/report-cards', icon: FileSpreadsheet, label: 'Report Cards' },
      { path: '/admin/report-card-verify', icon: CheckSquare, label: 'Verify Cards' },
      { path: '/admin/promotions', icon: ArrowUpRight, label: 'Promotions' },
      { path: '/admin/grading-system', icon: Settings, label: 'Grading' },
    ],
  },
  {
    title: 'CAMIS',
    items: [
      { path: '/admin/exam-papers', icon: FileSpreadsheet, label: 'Exam Papers' },
      { path: '/admin/exam-distribution', icon: FileSpreadsheet, label: 'Distribution' },
      { path: '/admin/curriculum', icon: BookOpen, label: 'Curriculum' },
      { path: '/admin/imihigo', icon: Target, label: 'Imihigo' },
      { path: '/admin/submissions', icon: Send, label: 'Submissions' },
      { path: '/admin/teacher-performance', icon: GraduationCap, label: 'Performance' },
    ],
  },
  {
    title: 'Communication',
    items: [
      { path: '/admin/notifications', icon: Bell, label: 'Notifications' },
      { path: '/admin/announcements', icon: Bell, label: 'Announcements' },
      { path: '/admin/support', icon: HelpCircle, label: 'Support' },
    ],
  },
  {
    title: 'System',
    items: [
      { path: '/admin/analytics', icon: LayoutDashboard, label: 'Analytics' },
      { path: '/admin/documents', icon: FileSpreadsheet, label: 'Documents' },
      { path: '/admin/calendar', icon: Calendar, label: 'Calendar' },
      { path: '/admin/settings', icon: Settings, label: 'Settings' },
      { path: '/admin/backups', icon: Database, label: 'Backups' },
    ],
  },
];

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = async () => { await logout(); navigate('/login'); };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`${collapsed ? 'w-[68px]' : 'w-64'} glass border-r border-border/30 flex flex-col fixed inset-y-0 left-0 z-50 transition-all duration-300 md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-border/30">
          <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center flex-shrink-0 shadow-soft">
            <span className="text-primary-foreground font-bold text-lg">S</span>
          </div>
          {!collapsed && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="ml-3">
              <span className="text-xl font-bold tracking-tight">CAMIS</span>
              <p className="text-[10px] text-muted-foreground -mt-0.5">Admin Portal</p>
            </motion.div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="ml-auto p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors hidden md:flex">
            <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto py-4 px-2 space-y-4">
          {menuSections.map((section) => (
            <div key={section.title}>
              {!collapsed && (
                <p className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                  {section.title}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    title={collapsed ? item.label : ''}
                    className={({ isActive }) =>
                      `flex items-center ${collapsed ? 'justify-center px-2' : 'px-3'} py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-soft'
                          : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                      }`
                    }
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="ml-3">{item.label}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Main */}
      <div className={`flex-1 flex flex-col h-screen overflow-hidden ${collapsed ? 'md:ml-[68px]' : 'md:ml-64'} transition-all duration-300`}>
        {/* Topbar */}
        <header className="h-16 glass border-b border-border/30 flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 rounded-md text-muted-foreground hover:bg-accent transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-9 pr-4 py-2 bg-muted/50 rounded-xl text-sm focus:ring-2 focus:ring-ring/20 focus:bg-background w-64 transition-all placeholder:text-muted-foreground/50"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title="Toggle theme">
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border-2 border-background"></span>
            </button>
            <div className="h-8 w-px bg-border mx-1"></div>
            <div className="flex items-center gap-3">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium">{user?.first_name || 'Admin'}</p>
                <p className="text-xs text-muted-foreground">{user?.role || 'Administrator'}</p>
              </div>
              <Avatar name={`${user?.first_name} ${user?.last_name}`} size="sm" />
              <button onClick={handleLogout} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors" title="Logout">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-muted/30 p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
