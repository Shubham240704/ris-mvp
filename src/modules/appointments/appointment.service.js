const { prisma } = require("../../config/prisma");
const { recordAudit } = require("../../services/audit.service");

function createServiceError(statusCode, message) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

// Create an appointment for an existing patient.
async function createAppointment(data, actorId) {
    return prisma.$transaction(async (tx) => {
        const patient = await tx.patient.findUnique({
            where: { id: data.patientId },
            select: { id: true },
        });

        if (!patient) {
            throw createServiceError(404, "Patient not found");
        }

        const appointment = await tx.appointment.create({
            data: {
                ...data,
                createdById: actorId,
            },
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
        });

        await recordAudit(tx, {
            actorId,
            action: "APPOINTMENT_CREATED",
            entityType: "Appointment",
            entityId: appointment.id,
            details: {
                modality: appointment.modality,
                procedure: appointment.procedure,
            },
        });

        return appointment;
    });
}

// List appointments with pagination and filters.
async function listAppointments(query) {
    const {
        page,
        limit,
        patientId,
        modality,
        status,
        from,
        to,
    } = query;

    if (from && to && from > to) {
        throw createServiceError(
            400,
            "The start date must not be later than the end date"
        );
    }

    const where = {
        ...(patientId ? { patientId } : {}),
        ...(modality ? { modality } : {}),
        ...(status ? { status } : {}),
        ...(from || to
            ? {
                scheduledAt: {
                    ...(from ? { gte: from } : {}),
                    ...(to ? { lte: to } : {}),
                },
            }
            : {}),
    };

    const [appointments, total] = await prisma.$transaction([
        prisma.appointment.findMany({
            where,
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
            orderBy: { scheduledAt: "asc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.appointment.count({ where }),
    ]);

    return {
        appointments,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}

// Retrieve one appointment by its ID.
async function getAppointmentById(id) {
    return prisma.appointment.findUnique({
        where: { id },
        include: {
            patient: {
                select: {
                    id: true,
                    patientNumber: true,
                    firstName: true,
                    lastName: true,
                },
            },
            orders: true,
        },
    });
}

// Update appointment details or reschedule it.
async function updateAppointment(id, data, actorId) {
    return prisma.$transaction(async (tx) => {
        const existing = await tx.appointment.findUnique({
            where: { id },
        });

        if (!existing) {
            throw createServiceError(404, "Appointment not found");
        }

        const closedStatuses = [
            "COMPLETED",
            "CANCELLED",
            "NO_SHOW",
        ];

        if (closedStatuses.includes(existing.status)) {
            throw createServiceError(
                409,
                "A completed, cancelled, or missed appointment cannot be rescheduled"
            );
        }

        const appointment = await tx.appointment.update({
            where: { id },
            data,
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
        });

        await recordAudit(tx, {
            actorId,
            action: "APPOINTMENT_UPDATED",
            entityType: "Appointment",
            entityId: appointment.id,
            details: {
                changedFields: Object.keys(data),
            },
        });

        return appointment;
    });
}

// Only permit explicitly defined status transitions.
const allowedTransitions = {
    SCHEDULED: [
        "CONFIRMED",
        "CHECKED_IN",
        "CANCELLED",
        "NO_SHOW",
    ],
    CONFIRMED: [
        "CHECKED_IN",
        "CANCELLED",
        "NO_SHOW",
    ],
    CHECKED_IN: [
        "COMPLETED",
        "CANCELLED",
    ],
    COMPLETED: [],
    CANCELLED: [],
    NO_SHOW: [],
};

// Update appointment status and record the change.
async function changeAppointmentStatus(id, status, actorId) {
    return prisma.$transaction(async (tx) => {
        const existing = await tx.appointment.findUnique({
            where: { id },
        });

        if (!existing) {
            throw createServiceError(404, "Appointment not found");
        }

        const allowed = allowedTransitions[existing.status] || [];

        if (!allowed.includes(status)) {
            throw createServiceError(
                409,
                `Invalid status transition from ${existing.status} to ${status}`
            );
        }

        const appointment = await tx.appointment.update({
            where: { id },
            data: { status },
        });

        await recordAudit(tx, {
            actorId,
            action: "APPOINTMENT_STATUS_CHANGED",
            entityType: "Appointment",
            entityId: appointment.id,
            details: {
                previousStatus: existing.status,
                newStatus: status,
            },
        });

        return appointment;
    });
}

module.exports = {
    createAppointment,
    listAppointments,
    getAppointmentById,
    updateAppointment,
    changeAppointmentStatus,
};