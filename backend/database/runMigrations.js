import fs from "fs/promises";
import path from "path";
import pool from "../config/db.js";
import logger from "../config/logger.js";

export async function runMigrations() {
    try {
        // Create migrations tracking table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                id SERIAL PRIMARY KEY,
                filename VARCHAR(255) UNIQUE NOT NULL,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Get list of already applied migrations
        const { rows: applied } = await pool.query(
            "SELECT filename FROM schema_migrations ORDER BY id"
        );
        const appliedSet = new Set(applied.map((r) => r.filename));

        // Read migration files
        const migrationsDir = path.join(process.cwd(), "database", "migrations");
        let files;
        try {
            files = await fs.readdir(migrationsDir);
        } catch {
            logger.info("No migrations directory found, skipping migrations");
            return;
        }

        const sqlFiles = files
            .filter((f) => f.endsWith(".sql"))
            .sort();

        let ran = 0;
        for (const file of sqlFiles) {
            if (appliedSet.has(file)) continue;

            logger.info(`Running migration: ${file}`);
            const filePath = path.join(migrationsDir, file);
            const sql = await fs.readFile(filePath, "utf8");

            await pool.query(sql);
            await pool.query(
                "INSERT INTO schema_migrations (filename) VALUES ($1)",
                [file]
            );

            logger.info(`Migration completed: ${file}`);
            ran++;
        }

        if (ran === 0) {
            logger.info("All migrations already applied");
        } else {
            logger.info(`${ran} migration(s) applied successfully`);
        }
    } catch (error) {
        logger.error("Migration failed", { error: error.message });
        throw error;
    }
}
