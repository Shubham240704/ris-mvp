
const { z } = require("zod");

const reportStatuses = [
    "DRAFT",
    "REVIEWED",
    "FINALIZED",
];

// Create a new draft report.
const createReportSchema = z.object({
    orderId: z.string().uuid(),

    findings: z
        .string()
        .trim()
        .max(10000)
        .optional(),

    impression: z
        .string()
        .trim()
        .max(5000)
        .optional(),
});

// Update an existing draft report.
const updateReportSchema = z
    .object({
        findings: z
            .string()
            .trim()
            .max(10000)
            .optional(),

        impression: z
            .string()
            .trim()
            .max(5000)
            .optional(),
    })
    .refine(
        (data) =>
            data.findings !== undefined ||
            data.impression !== undefined,
        {
            message: "Provide at least one field to update",
        }
    );

// List and filter radiology reports.
const listReportsSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int().min(1).max(100).default(20),

    orderId: z.string().uuid().optional(),

    status: z.enum(reportStatuses).optional(),
});

module.exports = {
    createReportSchema,
    updateReportSchema,
    listReportsSchema,
};
