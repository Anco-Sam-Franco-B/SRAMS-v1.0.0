import express from "express";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import { constants } from "fs";
import { createServer } from "http";
import compression from "compression";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import StartupLoader from "./utils/startupLoader.js";
import { startCronJobs } from "./cron/index.js";
import jwt from "jsonwebtoken";
import transporter from "./config/mail.js";
import logger from "./config/logger.js";
import { sendStartupNotification } from "./utils/startupNotification.js";
import { initializeDatabase } from "./database/initDatabase.js";
import pool from "./config/db.js";
import { initSocket } from "./config/socket.js";
import swaggerSpec from "./config/swagger.js";
import { globalLimiter } from "./middleware/rateLimiter.js";
import { sanitize } from "./middleware/sanitize.js";
import "./cron/databaseBackup.js";
import sramsRoutes from "./routes/index.js";
import errorHandler from "./middleware/errorHandler.js";
import cors from "cors";
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();
const server = createServer(app);
const loader = new StartupLoader();

// Initialize Socket.io
initSocket(server);

const strictCorsOptions = {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
};

loader.add("Loading Environment Variables", async () => {
    if (!process.env.PORT) throw new Error("PORT missing");
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL missing");
});

loader.add("Checking PostgreSQL Connection", async () => {
    await pool.query("SELECT NOW()");
});

loader.add("Initializing Database Schema & Migrations", async () => {
    await initializeDatabase();
});

loader.add("Loading Middleware", async () => {
    app.use(compression());
    app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }));
    app.use(express.json({ limit: "10mb" }));
    app.use(express.urlencoded({ extended: true }));
    app.use(cors(strictCorsOptions));
    app.use(cookieParser());
    app.use(globalLimiter);
    app.use(sanitize);
    app.use("/api/v1/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        customSiteTitle: "SRAMS API Docs",
        customCss: ".swagger-ui .topbar { display: none }",
    }));
});

loader.add("Loading Routes", async () => {
    app.get("/", (req, res) => {
        res.send("SRAMS API Running");
    });
    app.use("/api/v1", sramsRoutes);

    // Error handler (must be after routes)
    app.use(errorHandler);
});

loader.add("Checking Upload Folder", async () => {
    const uploadPath = path.join(process.cwd(), "uploads");
    try {
        await fs.access(uploadPath);
    } catch {
        await fs.mkdir(uploadPath, { recursive: true });
    }
    await fs.mkdir(uploadPath, { recursive: true });
    await fs.access(uploadPath, constants.W_OK);
});

loader.add("Checking SMTP Server", async () => {
    if (
        !process.env.SMTP_HOST ||
        !process.env.SMTP_PORT ||
        !process.env.SMTP_EMAIL ||
        !process.env.SMTP_PASSWORD
    ) {
        throw new Error("SMTP configuration is incomplete.");
    }
    await transporter.verify();
});

loader.add("Testing Email Service", async () => {
    await transporter.verify();
    if (process.env.NODE_ENV === "development") {
        await sendStartupNotification();
    }
});

loader.add("Loading Winston Logger", async () => {
    if (!logger) throw new Error("Winston logger is not initialized.");
    logger.info("========================================");
    logger.info("SRAMS Logger Initialized");
    logger.info(`Environment: ${process.env.NODE_ENV}`);
    logger.info(`Started At: ${new Date().toISOString()}`);
    logger.info("========================================");
});

loader.add("Loading Authentication", async () => {
    const required = ["JWT_SECRET", "JWT_EXPIRES_IN", "REFRESH_TOKEN_SECRET", "REFRESH_TOKEN_EXPIRES_IN"];
    for (const env of required) {
        if (!process.env[env]) throw new Error(`${env} is missing in .env`);
    }
    const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    jwt.verify(token, process.env.JWT_SECRET);
});

loader.add("Loading Scheduler", async () => {
    startCronJobs();
});

loader.add("Starting HTTP Server", async () => {
    await new Promise((resolve) => {
        server.listen(process.env.PORT, () => {
            logger.info(`Server running on port ${process.env.PORT}`);
            resolve();
        });
    });
});

await loader.run();
