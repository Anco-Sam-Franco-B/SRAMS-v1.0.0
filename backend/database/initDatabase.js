import fs from "fs/promises";
import path from "path";
import pool from "../config/db.js";
import logger from "../config/logger.js";

async function ensureColumns() {
    const statements = [
        `ALTER TABLE students ADD COLUMN IF NOT EXISTS pin_hash TEXT`,
        `ALTER TABLE students ADD COLUMN IF NOT EXISTS pin_changed_at TIMESTAMP`,
        `ALTER TABLE students ADD COLUMN IF NOT EXISTS pin_attempts INT DEFAULT 0`,
        `ALTER TABLE students ADD COLUMN IF NOT EXISTS pin_locked_until TIMESTAMP`,
        `ALTER TABLE students ADD COLUMN IF NOT EXISTS user_id UUID`,
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP`,
        `ALTER TABLE attendance ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
        `ALTER TABLE assessments ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
        `ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS entity_type VARCHAR(100)`,
        `ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS entity_id UUID`,
        `ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS old_values JSONB`,
        `ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS new_values JSONB`,
        `ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS ip_address INET`,
        `ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_agent TEXT`,
        `CREATE INDEX IF NOT EXISTS idx_students_pin_locked ON students(pin_locked_until)`,
        `CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id)`,
    ];

    for (const sql of statements) {
        try {
            await pool.query(sql);
        } catch (e) {
            logger.warn(`Column ensure warning: ${e.message}`);
        }
    }
}

export async function initializeDatabase() {
    try {
        logger.info("Checking database connection...");
        await pool.query("SELECT NOW()");
        logger.info("Database connected");

        // Create schema_migrations table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                id SERIAL PRIMARY KEY,
                filename VARCHAR(255) UNIQUE NOT NULL,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Run the base schema
        const schemaPath = path.join(process.cwd(), "database", "schema.sql");
        const schema = await fs.readFile(schemaPath, "utf8");

        // Ensure all critical columns exist BEFORE schema (prevents index failures on existing tables)
        logger.info("Ensuring all columns exist...");
        await ensureColumns();
        logger.info("Columns verified");

        logger.info("Loading database schema...");
        await pool.query(schema);
        logger.info("Database schema loaded successfully");

        // Run migrations
        const migrationsDir = path.join(process.cwd(), "database", "migrations");
        let files;
        try {
            files = await fs.readdir(migrationsDir);
        } catch {
            logger.info("No migrations directory found, skipping");
            return;
        }

        const { rows: applied } = await pool.query(
            "SELECT filename FROM schema_migrations ORDER BY id"
        );
        const appliedSet = new Set(applied.map((r) => r.filename));

        const sqlFiles = files.filter((f) => f.endsWith(".sql")).sort();
        let ran = 0;

        for (const file of sqlFiles) {
            if (appliedSet.has(file)) continue;

            logger.info(`Running migration: ${file}`);
            const filePath = path.join(migrationsDir, file);
            const sql = await fs.readFile(filePath, "utf8");

            try {
                await pool.query(sql);
                await pool.query(
                    "INSERT INTO schema_migrations (filename) VALUES ($1)",
                    [file]
                );
                logger.info(`Migration completed: ${file}`);
                ran++;
            } catch (migrationError) {
                logger.error(`Migration ${file} failed: ${migrationError.message}`);
            }
        }

        if (ran === 0) {
            logger.info("All migrations already applied");
        } else {
            logger.info(`${ran} migration(s) applied successfully`);
        }
    } catch (error) {
        logger.error("Database initialization failed", { error: error.message });
        throw error;
    }
}
