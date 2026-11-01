
const { prisma } = require("../../config/prisma");
const { recordAudit } = require("../../services/audit.service");

function createServiceError(statusCode, message) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

// Confirm the user is an active radiologist.
async function verifyRadiologist(tx, actorId) {
    const actor = await tx.user.findUnique({
        where: { id: actorId },
        select: {
            id: true,
            role: true,
            active: true,
        },
    });

    if (!actor || !actor.active) {
        throw createServiceError(401, "Radiologist account is unavailable");
    }

    if (actor.role !== "RADIOLOGIST") {
        throw createServiceError(403, "Only radiologists can perform this action");
    }

    return actor;
}

const reportInclude = {
    order: {
        include: {
            patient: {
                select: {
                    id: true,
                    patientNumber: true,
                    firstName: true,
                    lastName: true,
                },
            },
        },
    },
    author: {
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
        },
    },
};

// Create a draft report for a completed radiology order.
async function createReport(data, actorId) {
    return prisma.$transaction(async (tx) => {
        await verifyRadiologist(tx, actorId);

        const order = await tx.radiologyOrder.findUnique({
            where: { id: data.orderId },
            select: {
                id: true,
                accessionNo: true,
                status: true,
            },
        });

        if (!order) {
            throw createServiceError(404, "Radiology order not found");
        }

        if (order.status !== "COMPLETED") {
            throw createServiceError(
                409,
                "A report can only be created for a completed radiology order"
            );
        }

        const existingReport = await tx.radiologyReport.findUnique({
            where: { orderId: data.orderId },
            select: { id: true },
        });

        if (existingReport) {
            throw createServiceError(
                409,
                "A report already exists for this radiology order"
            );
        }

        const report = await tx.radiologyReport.create({
            data: {
                orderId: data.orderId,
                authorId: actorId,
                findings: data.findings ?? "",
                impression: data.impression ?? "",
                status: "DRAFT",
            },
            include: reportInclude,
        });

        await recordAudit(tx, {
            actorId,
            action: "RADIOLOGY_REPORT_CREATED",
            entityType: "RadiologyReport",
            entityId: report.id,
            details: {
                orderId: report.orderId,
                accessionNo: order.accessionNo,
                status: report.status,
            },
        });

        return report;
    });
}

// List and filter reports.
async function listReports(query) {
    const { page, limit, orderId, status } = query;

    const where = {
        ...(orderId ? { orderId } : {}),
        ...(status ? { status } : {}),
    };

    const [reports, total] = await prisma.$transaction([
        prisma.radiologyReport.findMany({
            where,
            include: reportInclude,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),

        prisma.radiologyReport.count({ where }),
    ]);

    return {
        reports,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}

// Retrieve a report by its ID.
async function getReportById(id) {
    return prisma.radiologyReport.findUnique({
        where: { id },
        include: reportInclude,
    });
}

// Update only the author's own draft report.
async function updateReport(id, data, actorId) {
    return prisma.$transaction(async (tx) => {
        await verifyRadiologist(tx, actorId);

        const existing = await tx.radiologyReport.findUnique({
            where: { id },
        });

        if (!existing) {
            throw createServiceError(404, "Radiology report not found");
        }

        if (existing.authorId !== actorId) {
            throw createServiceError(
                403,
                "Only the report author can edit this draft"
            );
        }

        if (existing.status !== "DRAFT") {
            throw createServiceError(
                409,
                "Only draft reports can be edited"
            );
        }

        const result = await tx.radiologyReport.updateMany({
            where: {
                id,
                authorId: actorId,
                status: "DRAFT",
                updatedAt: existing.updatedAt,
            },
            data,
        });

        if (result.count !== 1) {
            throw createServiceError(
                409,
                "The report changed concurrently. Reload and try again."
            );
        }

        const report = await tx.radiologyReport.findUnique({
            where: { id },
            include: reportInclude,
        });

        await recordAudit(tx, {
            actorId,
            action: "RADIOLOGY_REPORT_UPDATED",
            entityType: "RadiologyReport",
            entityId: id,
            details: {
                changedFields: Object.keys(data),
            },
        });

        return report;
    });
}

// Move a complete draft into reviewed status.
// The reviewer must be a different radiologist from its author.
async function reviewReport(id, actorId) {
    return prisma.$transaction(async (tx) => {
        await verifyRadiologist(tx, actorId);

        const existing = await tx.radiologyReport.findUnique({
            where: { id },
        });

        if (!existing) {
            throw createServiceError(404, "Radiology report not found");
        }

        if (existing.status !== "DRAFT") {
            throw createServiceError(
                409,
                "Only draft reports can be reviewed"
            );
        }

        if (existing.authorId === actorId) {
            throw createServiceError(
                403,
                "A radiologist cannot review their own report"
            );
        }

        if (!existing.findings.trim() || !existing.impression.trim()) {
            throw createServiceError(
                400,
                "Findings and impression are required before review"
            );
        }

        const result = await tx.radiologyReport.updateMany({
            where: {
                id,
                status: "DRAFT",
                updatedAt: existing.updatedAt,
            },
            data: {
                status: "REVIEWED",
            },
        });

        if (result.count !== 1) {
            throw createServiceError(
                409,
                "The report changed concurrently. Reload and try again."
            );
        }

        const report = await tx.radiologyReport.findUnique({
            where: { id },
            include: reportInclude,
        });

        await recordAudit(tx, {
            actorId,
            action: "RADIOLOGY_REPORT_REVIEWED",
            entityType: "RadiologyReport",
            entityId: id,
            details: {
                authorId: existing.authorId,
                previousStatus: "DRAFT",
                newStatus: "REVIEWED",
            },
        });

        return report;
    });
}

// Finalize a reviewed report.
async function finalizeReport(id, actorId) {
    return prisma.$transaction(async (tx) => {
        await verifyRadiologist(tx, actorId);

        const existing = await tx.radiologyReport.findUnique({
            where: { id },
        });

        if (!existing) {
            throw createServiceError(404, "Radiology report not found");
        }

        if (existing.status !== "REVIEWED") {
            throw createServiceError(
                409,
                "Only reviewed reports can be finalized"
            );
        }

        const finalizedAt = new Date();

        const result = await tx.radiologyReport.updateMany({
            where: {
                id,
                status: "REVIEWED",
                updatedAt: existing.updatedAt,
            },
            data: {
                status: "FINALIZED",
                finalizedAt,
            },
        });

        if (result.count !== 1) {
            throw createServiceError(
                409,
                "The report changed concurrently. Reload and try again."
            );
        }

        const report = await tx.radiologyReport.findUnique({
            where: { id },
            include: reportInclude,
        });

        await recordAudit(tx, {
            actorId,
            action: "RADIOLOGY_REPORT_FINALIZED",
            entityType: "RadiologyReport",
            entityId: id,
            details: {
                previousStatus: "REVIEWED",
                newStatus: "FINALIZED",
                finalizedAt: finalizedAt.toISOString(),
            },
        });

        return report;
    });
}

module.exports = {
    createReport,
    listReports,
    getReportById,
    updateReport,
    reviewReport,
    finalizeReport,
};
