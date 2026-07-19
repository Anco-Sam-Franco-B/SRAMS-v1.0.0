export const validatePasswordStrength = (password) => {
  const errors = [];

  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength: errors.length === 0 ? 'strong' : errors.length <= 2 ? 'medium' : 'weak'
  };
};

export const checkPasswordHistory = async (userId, newPasswordHash, limit = 5) => {
  const pool = (await import('../config/db.js')).default;
  const { rows } = await pool.query(
    `SELECT password_hash FROM password_history
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  );

  const bcrypt = (await import('bcrypt')).default;
  for (const row of rows) {
    if (await bcrypt.compare(row.password_hash, newPasswordHash)) {
      return false; // Password was used recently
    }
  }
  return true; // Password is new
};

export const savePasswordHistory = async (userId, passwordHash) => {
  const pool = (await import('../config/db.js')).default;
  await pool.query(
    `INSERT INTO password_history (user_id, password_hash) VALUES ($1, $2)`,
    [userId, passwordHash]
  );
};
