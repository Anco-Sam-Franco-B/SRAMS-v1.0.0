import pool from '../config/db.js';

// ============================================================
// ROLE PERMISSION MATRIX
// ============================================================
const ROLE_PERMISSIONS = {
  Administrator: [
    'dashboard:read', 'students:crud', 'teachers:crud', 'classes:crud',
    'subjects:crud', 'academic_years:crud', 'terms:crud', 'assessments:crud',
    'marks:crud', 'marks:approve', 'marks:lock', 'marks:unlock',
    'attendance:crud', 'attendance:reports',
    'report_cards:crud', 'report_cards:generate', 'report_cards:publish',
    'promotions:crud', 'grading_system:crud', 'notifications:crud',
    'trades:crud', 'users:crud', 'system:read', 'system:manage',
    'backups:manage', 'audit_logs:read', 'sessions:manage',
    'timetable:crud', 'streams:crud', 'departments:crud', 'classrooms:crud',
    'discipline:crud', 'medical:crud', 'certificates:crud',
    'documents:crud', 'competencies:crud', 'school_profile:manage',
    'report_templates:crud', 'combinations:crud', 'transfers:crud'
  ],
  'School Administrator': [
    'dashboard:read', 'students:crud', 'teachers:read', 'classes:crud',
    'subjects:crud', 'academic_years:crud', 'terms:crud', 'assessments:crud',
    'marks:read', 'marks:approve', 'attendance:read', 'attendance:reports',
    'report_cards:read', 'report_cards:generate',
    'promotions:read', 'grading_system:read', 'notifications:crud',
    'trades:read', 'users:read', 'system:read',
    'timetable:read', 'streams:crud', 'departments:crud', 'classrooms:crud',
    'discipline:crud', 'medical:read', 'certificates:generate',
    'documents:read', 'competencies:read', 'school_profile:manage',
    'report_templates:read'
  ],
  'Head Teacher': [
    'dashboard:read', 'students:read', 'teachers:read', 'classes:read',
    'subjects:read', 'academic_years:read', 'terms:read', 'assessments:read',
    'marks:read', 'marks:final_approve', 'attendance:read', 'attendance:reports',
    'report_cards:read', 'report_cards:generate', 'report_cards:publish',
    'promotions:read', 'grading_system:read', 'notifications:crud',
    'trades:read', 'users:read', 'system:read',
    'timetable:read', 'discipline:read', 'medical:read',
    'certificates:generate', 'documents:read', 'school_profile:read'
  ],
  'Deputy Head Teacher': [
    'dashboard:read', 'students:read', 'teachers:read', 'classes:read',
    'subjects:read', 'academic_years:read', 'terms:read', 'assessments:read',
    'marks:read', 'marks:approve', 'attendance:read', 'attendance:reports',
    'report_cards:read', 'report_cards:generate',
    'promotions:read', 'grading_system:read', 'notifications:read',
    'trades:read', 'system:read', 'timetable:read',
    'discipline:crud', 'medical:read', 'documents:read'
  ],
  'Director of Studies': [
    'dashboard:read', 'students:read', 'teachers:read', 'classes:read',
    'subjects:crud', 'academic_years:read', 'terms:read', 'assessments:crud',
    'marks:read', 'marks:approve', 'attendance:read', 'attendance:reports',
    'report_cards:read', 'report_cards:generate',
    'promotions:read', 'grading_system:crud', 'notifications:read',
    'trades:read', 'system:read', 'timetable:crud',
    'competencies:crud', 'documents:read'
  ],
  Teacher: [
    'dashboard:read', 'students:read_assigned', 'classes:read_assigned',
    'subjects:read_assigned', 'academic_years:read', 'terms:read',
    'assessments:crud_own', 'marks:enter', 'marks:submit',
    'attendance:enter', 'report_cards:read_assigned',
    'notifications:read', 'trades:read'
  ],
  'Class Teacher': [
    'dashboard:read', 'students:read_class', 'classes:read_assigned',
    'subjects:read_assigned', 'academic_years:read', 'terms:read',
    'assessments:read', 'marks:enter', 'marks:submit', 'marks:verify',
    'attendance:enter', 'attendance:read_class',
    'report_cards:read_class', 'report_cards:verify',
    'notifications:read', 'trades:read',
    'discipline:read_class', 'medical:read_class'
  ],
  Student: [
    'dashboard:read', 'students:self', 'marks:self',
    'attendance:self', 'report_cards:self', 'assessments:self',
    'notifications:self', 'documents:self'
  ],
  Parent: [
    'dashboard:read', 'students:read_child', 'marks:read_child',
    'attendance:read_child', 'report_cards:read_child', 'notifications:self'
  ],
  'Finance Officer': [
    'dashboard:read', 'students:read', 'teachers:read',
    'report_cards:read', 'system:read'
  ],
  Registrar: [
    'dashboard:read', 'students:crud', 'teachers:read', 'classes:read',
    'subjects:read', 'report_cards:generate', 'certificates:crud',
    'documents:crud', 'transfers:crud', 'promotions:read'
  ],
  Librarian: [
    'dashboard:read', 'students:read'
  ],
  'Discipline Officer': [
    'dashboard:read', 'students:read', 'discipline:crud',
    'attendance:read', 'notifications:crud', 'report_cards:read'
  ],
  'Examination Officer': [
    'dashboard:read', 'students:read', 'teachers:read', 'classes:read',
    'subjects:crud', 'assessments:crud', 'marks:crud', 'marks:enter',
    'attendance:read', 'report_cards:crud', 'report_cards:generate',
    'grading_system:crud', 'competencies:crud', 'report_templates:crud'
  ],
  'System Auditor': [
    'dashboard:read', 'students:read', 'teachers:read', 'classes:read',
    'subjects:read', 'academic_years:read', 'terms:read',
    'marks:read', 'attendance:read', 'report_cards:read',
    'audit_logs:read', 'system:read', 'users:read'
  ]
};

// ============================================================
// PERMISSION CHECK MIDDLEWARE
// ============================================================
export const requirePermission = (...permissions) => {
  return async (req, res, next) => {
    try {
      // Get role from database if not already set
      if (!req.userRole) {
        const result = await pool.query(
          `SELECT r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1`,
          [req.user.id]
        );
        if (result.rows.length === 0) {
          return res.status(401).json({ error: 'User not found' });
        }
        req.userRole = result.rows[0].role_name;
      }

      const rolePerms = ROLE_PERMISSIONS[req.userRole] || [];
      const hasPermission = permissions.some(p => rolePerms.includes(p));

      if (!hasPermission) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          required: permissions,
          role: req.userRole
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

// Check if role has a specific permission
export const hasPermission = (role, permission) => {
  const rolePerms = ROLE_PERMISSIONS[role] || [];
  return rolePerms.includes(permission);
};

// Get all permissions for a role
export const getRolePermissions = (role) => {
  return ROLE_PERMISSIONS[role] || [];
};

// Get all roles
export const getAllRoles = () => {
  return Object.keys(ROLE_PERMISSIONS);
};

export { ROLE_PERMISSIONS };
