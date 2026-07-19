import express from 'express'
import BackupRouter from './backupRoutes.js'
import authRouter from './router/auth.route.js'
import dataRouter from './router/data.route.js'
import studentRouter from './router/student.route.js'
import teacherRouter from './router/teacher.route.js'
import classRouter from './router/class.route.js'
import subjectRouter from './router/subject.route.js'
import academicYearRouter from './router/academicYear.route.js'
import termRouter from './router/term.route.js'
import assessmentRouter from './router/assessment.route.js'
import markRouter from './router/mark.route.js'
import attendanceRouter from './router/attendance.route.js'
import reportCardRouter from './router/reportCard.route.js'
import promotionRouter from './router/promotion.route.js'
import gradingSystemRouter from './router/gradingSystem.route.js'
import notificationRouter from './router/notification.route.js'
import tradeRouter from './router/trade.route.js'
import userRouter from './router/user.route.js'
import dashboardRouter from './router/dashboard.route.js'
import teacherSubjectRouter from './router/teacherSubject.route.js'
import sessionRouter from './router/session.route.js'
import schoolProfileRouter from './router/schoolProfile.route.js'
import streamRouter from './router/stream.route.js'
import departmentRouter from './router/department.route.js'
import classroomRouter from './router/classroom.route.js'
import timetableRouter from './router/timetable.route.js'
import disciplineRouter from './router/discipline.route.js'
import medicalRouter from './router/medical.route.js'
import certificateRouter from './router/certificate.route.js'
import competencyRouter from './router/competency.route.js'
import parentRouter from './router/parent.route.js'
import financeRouter from './router/finance.route.js'
import libraryRouter from './router/library.route.js'
import calendarRouter from './router/calendar.route.js'
import announcementRouter from './router/announcement.route.js'
import messageRouter from './router/message.route.js'
import fileUploadRouter from './router/fileUpload.route.js'
import analyticsRouter from './router/analytics.route.js'
import examDistributionRouter from './router/examDistribution.route.js'
import curriculumRouter from './router/curriculum.route.js'
import imihigoRouter from './router/imihigo.route.js'
import submissionRouter from './router/submission.route.js'
import reportCardVerificationRouter from './router/reportCardVerification.route.js'
import teacherPerformanceRouter from './router/teacherPerformance.route.js'
import supportRouter from './router/support.route.js'
import { authenticate } from '../middleware/auth.middleware.js'
import { authorize } from '../middleware/authorization.js'

const sramsRoutes = express.Router()

// Auth routes
sramsRoutes.use('/auth', authRouter)

// Dashboard routes
sramsRoutes.use('/dashboard', dashboardRouter)

// Entity routes
sramsRoutes.use('/students', studentRouter)
sramsRoutes.use('/teachers', teacherRouter)
sramsRoutes.use('/classes', classRouter)
sramsRoutes.use('/subjects', subjectRouter)
sramsRoutes.use('/academic-years', academicYearRouter)
sramsRoutes.use('/terms', termRouter)
sramsRoutes.use('/assessments', assessmentRouter)
sramsRoutes.use('/marks', markRouter)
sramsRoutes.use('/attendance', attendanceRouter)
sramsRoutes.use('/report-cards', reportCardRouter)
sramsRoutes.use('/promotions', promotionRouter)
sramsRoutes.use('/grading-system', gradingSystemRouter)
sramsRoutes.use('/notifications', notificationRouter)
sramsRoutes.use('/trades', tradeRouter)
sramsRoutes.use('/users', userRouter)
sramsRoutes.use('/teacher-subjects', teacherSubjectRouter)

// Session management
sramsRoutes.use('/sessions', sessionRouter)

// School structure
sramsRoutes.use('/school-profile', schoolProfileRouter)
sramsRoutes.use('/streams', streamRouter)
sramsRoutes.use('/departments', departmentRouter)
sramsRoutes.use('/classrooms', classroomRouter)
sramsRoutes.use('/timetable', timetableRouter)
sramsRoutes.use('/discipline', disciplineRouter)
sramsRoutes.use('/medical', medicalRouter)
sramsRoutes.use('/certificates', certificateRouter)
sramsRoutes.use('/competencies', competencyRouter)

// Backup routes (admin only)
sramsRoutes.use('/backups', authenticate, authorize('Administrator'), BackupRouter)

// Parent routes
sramsRoutes.use('/parents', parentRouter)

// Finance routes
sramsRoutes.use('/finance', financeRouter)

// Library routes
sramsRoutes.use('/library', libraryRouter)

// Calendar routes
sramsRoutes.use('/calendar', calendarRouter)

// Announcement routes
sramsRoutes.use('/announcements', announcementRouter)

// Message routes
sramsRoutes.use('/messages', messageRouter)

// File upload routes
sramsRoutes.use('/upload', fileUploadRouter)

// Analytics routes
sramsRoutes.use('/analytics', analyticsRouter)

// Exam distribution routes
sramsRoutes.use('/exam-papers', examDistributionRouter)

// CAMIS module routes
sramsRoutes.use('/curriculum', curriculumRouter)
sramsRoutes.use('/imihigo', imihigoRouter)
sramsRoutes.use('/submissions', submissionRouter)
sramsRoutes.use('/report-card-verifications', reportCardVerificationRouter)
sramsRoutes.use('/teacher-performance', teacherPerformanceRouter)
sramsRoutes.use('/support', supportRouter)

// Legacy generic CRUD (admin only fallback)
sramsRoutes.use('/data', authenticate, authorize('Administrator'), dataRouter)

export default sramsRoutes
