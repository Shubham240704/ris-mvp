
require("./config/env");

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const { prisma } = require("./config/prisma");
const { corsOrigin, nodeEnv } = require("./config/env");

const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./config/swagger");

// Feature routes
const authRoutes = require("./modules/auth/auth.routes");
const patientRoutes = require("./modules/patients/patient.routes");
const appointmentRoutes = require("./modules/appointments/appointment.routes");
const orderRoutes = require("./modules/radiology-orders/order.routes");
const reportRoutes = require("./modules/radiology-reports/report.routes");
const staffRoutes = require("./modules/staff/staff.routes");
const dashboardRoutes = require("./modules/dashboard/dashboard.routes");

const app = express();

// Global middleware
app.use(helmet());
app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: "1mb" }));

if (nodeEnv !== "test") {
    app.use(morgan("dev"));
}

// API information
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Radiology Information System API",
        version: "1.0.0",
        endpoints: {
            health: "/api/health",
            login: "/api/auth/login",
            currentUser: "/api/auth/me",
            patients: "/api/patients",
            appointments: "/api/appointments",
            radiologyOrders: "/api/radiology-orders",
            radiologyReports: "/api/radiology-reports",
        },
    });
});

// Database health check
app.get("/api/health", async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;

        return res.status(200).json({
            success: true,
            service: "RIS API",
            database: "connected",
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Health check failed:", error.message);

        return res.status(503).json({
            success: false,
            service: "RIS API",
            database: "unavailable",
        });
    }
});

// Register feature routes
app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/radiology-orders", orderRoutes);
app.use("/api/radiology-reports", reportRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Swagger documentation
app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument)
);

app.get("/api-docs.json", (req, res) => {
    res.json(swaggerDocument);
});

// Not-found handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
    });
});

// Central error handler
app.use((error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }

    const statusCode = error.statusCode || 500;

    if (statusCode >= 500) {
        console.error("Request failed:", error.message);
    }

    return res.status(statusCode).json({
        success: false,
        message:
            statusCode < 500
                ? error.message
                : "Internal server error",
    });
});

module.exports = app;
