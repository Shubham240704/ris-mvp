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

const appointmentStatuses = [
    "SCHEDULED",
    "CONFIRMED",
    "CHECKED_IN",
    "COMPLETED",
    "CANCELLED",
    "NO_SHOW",
];

function validateFutureDate(data, ctx) {
    if (data.scheduledAt && data.scheduledAt <= new Date()) {
        ctx.addIssue({
            code: "custom",
            path: ["scheduledAt"],
            message: "Appointment must be scheduled in the future",
        });
    }
}

const createAppointmentSchema = z
    .object({
        patientId: z.string().uuid(),

        scheduledAt: z.coerce.date(),

        modality: z.enum(modalities),

        procedure: z
            .string()
            .trim()
            .min(1, "Procedure is required")
            .max(150),

        location: z.string().trim().max(150).optional(),

        notes: z.string().trim().max(1000).optional(),
    })
    .superRefine(validateFutureDate);

const updateAppointmentSchema = z
    .object({
        scheduledAt: z.coerce.date().optional(),

        modality: z.enum(modalities).optional(),

        procedure: z.string().trim().min(1).max(150).optional(),

        location: z.string().trim().max(150).optional(),

        notes: z.string().trim().max(1000).optional(),
    })
    .refine(
        (data) => Object.keys(data).length > 0,
        "Provide at least one field to update"
    )
    .superRefine(validateFutureDate);

const updateAppointmentStatusSchema = z.object({
    status: z.enum(appointmentStatuses),
});

const listAppointmentsSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int().min(1).max(100).default(20),

    patientId: z.string().uuid().optional(),

    modality: z.enum(modalities).optional(),

    status: z.enum(appointmentStatuses).optional(),

    from: z.coerce.date().optional(),

    to: z.coerce.date().optional(),
});

module.exports = {
    createAppointmentSchema,
    updateAppointmentSchema,
    updateAppointmentStatusSchema,
    listAppointmentsSchema,
};
