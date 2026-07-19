import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

// Auth Pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyEmail from './pages/auth/VerifyEmail';
import TwoFactorVerify from './pages/auth/TwoFactorVerify';
import PublicRoute from './protectedRoutes/PublicRoute';
import RoleRoute from './protectedRoutes/RoleRoute';
import AdminLayout from './layouts/AdminLayout';
import TeacherLayout from './layouts/TeacherLayout';
import StudentLayout from './layouts/StudentLayout';

// Lazy-loaded Admin Pages
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const Users = lazy(() => import('./pages/admin/Users'));
const Students = lazy(() => import('./pages/admin/Students'));
const Teachers = lazy(() => import('./pages/admin/Teachers'));
const TeacherAllocations = lazy(() => import('./pages/admin/TeacherAllocations'));
const Classes = lazy(() => import('./pages/admin/Classes'));
const Subjects = lazy(() => import('./pages/admin/Subjects'));
const Academics = lazy(() => import('./pages/admin/Academics'));
const Terms = lazy(() => import('./pages/admin/Terms'));
const Attendance = lazy(() => import('./pages/admin/Attendance'));
const Assessments = lazy(() => import('./pages/admin/Assessments'));
const Marks = lazy(() => import('./pages/admin/Marks'));
const ReportCards = lazy(() => import('./pages/admin/ReportCards'));
const Promotions = lazy(() => import('./pages/admin/Promotions'));
const Notifications = lazy(() => import('./pages/admin/Notifications'));
const Settings = lazy(() => import('./pages/admin/Settings'));
const GradingSystem = lazy(() => import('./pages/admin/GradingSystem'));
const Backups = lazy(() => import('./pages/admin/Backups'));
const ExamPapers = lazy(() => import('./pages/exams/ExamPapers'));
const ExamDistribution = lazy(() => import('./pages/exams/ExamDistribution'));
const Curriculum = lazy(() => import('./pages/curriculum/Curriculum'));
const ImihigoDashboard = lazy(() => import('./pages/imihigo/ImihigoDashboard'));
const Submissions = lazy(() => import('./pages/submissions/Submissions'));
const ReportCardVerify = lazy(() => import('./pages/admin/ReportCardVerify'));
const TeacherPerformance = lazy(() => import('./pages/teacher/TeacherPerformance'));
const SupportTickets = lazy(() => import('./pages/support/SupportTickets'));

// Lazy-loaded Teacher Pages
const TeacherDashboard = lazy(() => import('./pages/teacher/TeacherDashboard'));
const TeacherAttendance = lazy(() => import('./pages/teacher/TeacherAttendance'));
const TeacherMarks = lazy(() => import('./pages/teacher/TeacherMarks'));
const TeacherClasses = lazy(() => import('./pages/teacher/TeacherClasses'));
const TeacherAssessments = lazy(() => import('./pages/teacher/TeacherAssessments'));
const TeacherProfile = lazy(() => import('./pages/teacher/TeacherProfile'));

// Lazy-loaded Student Pages
const StudentDashboard = lazy(() => import('./pages/student/Dashboard'));
const StudentMarks = lazy(() => import('./pages/student/StudentMarks'));
const StudentAttendance = lazy(() => import('./pages/student/StudentAttendance'));
const StudentReportCard = lazy(() => import('./pages/student/StudentReportCard'));
const StudentAssessments = lazy(() => import('./pages/student/StudentAssessments'));
const StudentProfile = lazy(() => import('./pages/student/Profile'));
const ChangePin = lazy(() => import('./pages/student/ChangePin'));

// Lazy-loaded Parent Pages
const ParentLayout = lazy(() => import('./layouts/ParentLayout'));
const ParentDashboard = lazy(() => import('./pages/parent/Dashboard'));
const ParentMyChildren = lazy(() => import('./pages/parent/MyChildren'));
const ParentMarks = lazy(() => import('./pages/parent/Marks'));
const ParentAttendance = lazy(() => import('./pages/parent/Attendance'));
const ParentReportCards = lazy(() => import('./pages/parent/ReportCards'));
const ParentNotifications = lazy(() => import('./pages/parent/Notifications'));
const ParentProfile = lazy(() => import('./pages/parent/Profile'));

const Loading = () => (
  <div className="flex items-center justify-center h-64">
    <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
  </div>
);

// Lazy-loaded Enterprise Pages
const Analytics = lazy(() => import('./pages/admin/Analytics'));
const FinanceDashboard = lazy(() => import('./pages/finance/FinanceDashboard'));
const FeeStructures = lazy(() => import('./pages/finance/FeeStructures'));
const FeePayments = lazy(() => import('./pages/finance/FeePayments'));
const LibraryDashboard = lazy(() => import('./pages/library/LibraryDashboard'));
const Books = lazy(() => import('./pages/library/Books'));
const LibraryTransactions = lazy(() => import('./pages/library/Transactions'));
const CalendarPage = lazy(() => import('./pages/calendar/CalendarPage'));
const AnnouncementsPage = lazy(() => import('./pages/announcements/AnnouncementsPage'));
const MessagesPage = lazy(() => import('./pages/messages/MessagesPage'));
const DocumentsPage = lazy(() => import('./pages/admin/Documents'));

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/verify-2fa" element={<TwoFactorVerify />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Route>

      {/* Admin Routes */}
      <Route element={<RoleRoute allowedRoles={['Administrator', 'School Administrator', 'Head Teacher', 'Deputy Head Teacher', 'Director of Studies', 'Examination Officer', 'Registrar']} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Suspense fallback={<Loading />}><Dashboard /></Suspense>} />
          <Route path="users" element={<Suspense fallback={<Loading />}><Users /></Suspense>} />
          <Route path="students" element={<Suspense fallback={<Loading />}><Students /></Suspense>} />
          <Route path="teachers" element={<Suspense fallback={<Loading />}><Teachers /></Suspense>} />
          <Route path="teacher-allocations" element={<Suspense fallback={<Loading />}><TeacherAllocations /></Suspense>} />
          <Route path="classes" element={<Suspense fallback={<Loading />}><Classes /></Suspense>} />
          <Route path="subjects" element={<Suspense fallback={<Loading />}><Subjects /></Suspense>} />
          <Route path="academics" element={<Suspense fallback={<Loading />}><Academics /></Suspense>} />
          <Route path="terms" element={<Suspense fallback={<Loading />}><Terms /></Suspense>} />
          <Route path="attendance" element={<Suspense fallback={<Loading />}><Attendance /></Suspense>} />
          <Route path="assessments" element={<Suspense fallback={<Loading />}><Assessments /></Suspense>} />
          <Route path="marks" element={<Suspense fallback={<Loading />}><Marks /></Suspense>} />
          <Route path="report-cards" element={<Suspense fallback={<Loading />}><ReportCards /></Suspense>} />
          <Route path="promotions" element={<Suspense fallback={<Loading />}><Promotions /></Suspense>} />
          <Route path="notifications" element={<Suspense fallback={<Loading />}><Notifications /></Suspense>} />
          <Route path="settings" element={<Suspense fallback={<Loading />}><Settings /></Suspense>} />
          <Route path="grading-system" element={<Suspense fallback={<Loading />}><GradingSystem /></Suspense>} />
          <Route path="backups" element={<Suspense fallback={<Loading />}><Backups /></Suspense>} />
          <Route path="analytics" element={<Suspense fallback={<Loading />}><Analytics /></Suspense>} />
          <Route path="documents" element={<Suspense fallback={<Loading />}><DocumentsPage /></Suspense>} />
          <Route path="calendar" element={<Suspense fallback={<Loading />}><CalendarPage /></Suspense>} />
          <Route path="announcements" element={<Suspense fallback={<Loading />}><AnnouncementsPage /></Suspense>} />
          <Route path="exam-papers" element={<Suspense fallback={<Loading />}><ExamPapers /></Suspense>} />
          <Route path="exam-distribution" element={<Suspense fallback={<Loading />}><ExamDistribution /></Suspense>} />
          <Route path="curriculum" element={<Suspense fallback={<Loading />}><Curriculum /></Suspense>} />
          <Route path="imihigo" element={<Suspense fallback={<Loading />}><ImihigoDashboard /></Suspense>} />
          <Route path="submissions" element={<Suspense fallback={<Loading />}><Submissions /></Suspense>} />
          <Route path="report-card-verify" element={<Suspense fallback={<Loading />}><ReportCardVerify /></Suspense>} />
          <Route path="teacher-performance" element={<Suspense fallback={<Loading />}><TeacherPerformance /></Suspense>} />
          <Route path="support" element={<Suspense fallback={<Loading />}><SupportTickets /></Suspense>} />
        </Route>
      </Route>

      {/* Finance Routes */}
      <Route element={<RoleRoute allowedRoles={['Administrator', 'Finance Officer']} />}>
        <Route path="/finance" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Suspense fallback={<Loading />}><FinanceDashboard /></Suspense>} />
          <Route path="fee-structures" element={<Suspense fallback={<Loading />}><FeeStructures /></Suspense>} />
          <Route path="payments" element={<Suspense fallback={<Loading />}><FeePayments /></Suspense>} />
        </Route>
      </Route>

      {/* Library Routes */}
      <Route element={<RoleRoute allowedRoles={['Administrator', 'Librarian']} />}>
        <Route path="/library" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Suspense fallback={<Loading />}><LibraryDashboard /></Suspense>} />
          <Route path="books" element={<Suspense fallback={<Loading />}><Books /></Suspense>} />
          <Route path="transactions" element={<Suspense fallback={<Loading />}><LibraryTransactions /></Suspense>} />
        </Route>
      </Route>

      {/* Messages Routes (any authenticated user) */}
      <Route element={<RoleRoute allowedRoles={['Administrator', 'School Administrator', 'Head Teacher', 'Deputy Head Teacher', 'Director of Studies', 'Teacher', 'Class Teacher', 'Student', 'Parent', 'Finance Officer', 'Registrar', 'Librarian', 'Discipline Officer', 'Examination Officer']} />}>
        <Route path="/messages" element={<AdminLayout />}>
          <Route index element={<Suspense fallback={<Loading />}><MessagesPage /></Suspense>} />
        </Route>
      </Route>

      {/* Teacher Routes */}
      <Route element={<RoleRoute allowedRoles={['Teacher', 'Class Teacher', 'Administrator', 'Head Teacher', 'Director of Studies']} />}>
        <Route path="/teacher" element={<TeacherLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Suspense fallback={<Loading />}><TeacherDashboard /></Suspense>} />
          <Route path="attendance" element={<Suspense fallback={<Loading />}><TeacherAttendance /></Suspense>} />
          <Route path="marks" element={<Suspense fallback={<Loading />}><TeacherMarks /></Suspense>} />
          <Route path="classes" element={<Suspense fallback={<Loading />}><TeacherClasses /></Suspense>} />
          <Route path="assessments" element={<Suspense fallback={<Loading />}><TeacherAssessments /></Suspense>} />
          <Route path="profile" element={<Suspense fallback={<Loading />}><TeacherProfile /></Suspense>} />
        </Route>
      </Route>

      {/* Student Routes */}
      <Route element={<RoleRoute allowedRoles={['Student']} />}>
        <Route path="/student" element={<StudentLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Suspense fallback={<Loading />}><StudentDashboard /></Suspense>} />
          <Route path="marks" element={<Suspense fallback={<Loading />}><StudentMarks /></Suspense>} />
          <Route path="attendance" element={<Suspense fallback={<Loading />}><StudentAttendance /></Suspense>} />
          <Route path="report-card" element={<Suspense fallback={<Loading />}><StudentReportCard /></Suspense>} />
          <Route path="assessments" element={<Suspense fallback={<Loading />}><StudentAssessments /></Suspense>} />
          <Route path="profile" element={<Suspense fallback={<Loading />}><StudentProfile /></Suspense>} />
          <Route path="change-pin" element={<Suspense fallback={<Loading />}><ChangePin /></Suspense>} />
        </Route>
      </Route>

      {/* Parent Routes */}
      <Route element={<RoleRoute allowedRoles={['Parent']} />}>
        <Route path="/parent" element={<Suspense fallback={<Loading />}><ParentLayout /></Suspense>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Suspense fallback={<Loading />}><ParentDashboard /></Suspense>} />
          <Route path="children" element={<Suspense fallback={<Loading />}><ParentMyChildren /></Suspense>} />
          <Route path="marks" element={<Suspense fallback={<Loading />}><ParentMarks /></Suspense>} />
          <Route path="attendance" element={<Suspense fallback={<Loading />}><ParentAttendance /></Suspense>} />
          <Route path="report-cards" element={<Suspense fallback={<Loading />}><ParentReportCards /></Suspense>} />
          <Route path="notifications" element={<Suspense fallback={<Loading />}><ParentNotifications /></Suspense>} />
          <Route path="profile" element={<Suspense fallback={<Loading />}><ParentProfile /></Suspense>} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
