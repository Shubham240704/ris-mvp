const { z } = require("zod");

const modalities = [
    "XRAY",
    "CT",
    "MRI",
    "ULTRASOUND",
    "MAMMOGRAPHY",
    "PET_CT",
    "OTHER",
];

const orderPriorities = [
    "ROUTINE",
    "URGENT",
    "STAT",
];

const orderStatuses = [
    "ORDERED",
    "SCHEDULED",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
];

const createOrderSchema = z.object({
    patientId: z.string().uuid(),

    appointmentId: z.string().uuid().optional(),

    modality: z.enum(modalities),

    procedure: z
        .string()
        .trim()
        .min(1, "Procedure is required")
        .max(150),

    clinicalNote: z
        .string()
        .trim()
        .max(2000)
        .optional(),

    priority: z
        .enum(orderPriorities)
        .default("ROUTINE"),
});

const updateOrderStatusSchema = z.object({
    status: z.enum(orderStatuses),
});
const orderStatusOverrideSchema = z.object({
    status: z.enum(orderStatuses),

    reason: z
        .string()
        .trim()
        .min(10, "Provide a meaningful override reason of at least 10 characters")
        .max(1000, "Override reason cannot exceed 1000 characters"),
});

const listOrdersSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int().min(1).max(100).default(20),

    patientId: z.string().uuid().optional(),

    appointmentId: z.string().uuid().optional(),

    modality: z.enum(modalities).optional(),

    priority: z.enum(orderPriorities).optional(),

    status: z.enum(orderStatuses).optional(),
});

module.exports = {
    createOrderSchema,
    updateOrderStatusSchema,
    orderStatusOverrideSchema,
    listOrdersSchema,
};