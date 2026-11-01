
const { z } = require("zod");

// Administrators cannot invite another ADMIN through this endpoint.
const staffRoles = [
    "RECEPTIONIST",
    "RADIOLOGIST",
    "TECHNICIAN",
    "PHARMACIST",
];

const invitationStatuses = [
    "PENDING",
    "ACCEPTED",
    "REVOKED",
    "EXPIRED",
];

// Admin creates a staff invitation.
const createInvitationSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2)
        .max(120),

    email: z
        .string()
        .trim()
        .email()
        .max(254)
        .transform((email) => email.toLowerCase()),

    role: z.enum(staffRoles),
});

// Staff accepts an invitation and creates a password.
const acceptInvitationSchema = z.object({
    token: z
        .string()
        .length(64)
        .regex(/^[a-f0-9]{64}$/i),

    password: z
        .string()
        .min(12, "Password must contain at least 12 characters")
        .max(200),
});

// Admin lists and filters invitations.
const listInvitationsSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int().min(1).max(100).default(20),

    status: z.enum(invitationStatuses).optional(),

    email: z
        .string()
        .trim()
        .email()
        .max(254)
        .transform((email) => email.toLowerCase())
        .optional(),
});

module.exports = {
    createInvitationSchema,
    acceptInvitationSchema,
    listInvitationsSchema,
};
