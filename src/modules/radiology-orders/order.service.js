const crypto = require("crypto");

const { prisma } = require("../../config/prisma");
const { recordAudit } = require("../../services/audit.service");

function createServiceError(statusCode, message) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

// Create a radiology order for an existing patient.
async function createOrder(data, actorId) {
    return prisma.$transaction(async (tx) => {
        const patient = await tx.patient.findUnique({
            where: { id: data.patientId },
            select: { id: true },
        });

        if (!patient) {
            throw createServiceError(404, "Patient not found");
        }

        // If an appointment is supplied, verify its patient and modality.
        if (data.appointmentId) {
            const appointment = await tx.appointment.findUnique({
                where: { id: data.appointmentId },
                select: {
                    id: true,
                    patientId: true,
                    modality: true,
                    status: true,
                },
            });

            if (!appointment) {
                throw createServiceError(404, "Appointment not found");
            }

            if (appointment.patientId !== data.patientId) {
                throw createServiceError(
                    400,
                    "The appointment does not belong to the specified patient"
                );
            }

            if (appointment.modality !== data.modality) {
                throw createServiceError(
                    400,
                    "Order modality must match the appointment modality"
                );
            }

            if (
                ["CANCELLED", "COMPLETED", "NO_SHOW"].includes(
                    appointment.status
                )
            ) {
                throw createServiceError(
                    409,
                    "Cannot create an order from a closed appointment"
                );
            }
        }

        // Use a UUID-based accession number to reduce collision risk.
        const accessionNo = `ACC-${crypto.randomUUID().toUpperCase()}`;

        const order = await tx.radiologyOrder.create({
            data: {
                accessionNo,
                patientId: data.patientId,
                appointmentId: data.appointmentId,
                modality: data.modality,
                procedure: data.procedure,
                clinicalNote: data.clinicalNote,
                priority: data.priority,
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
                appointment: true,
            },
        });

        await recordAudit(tx, {
            actorId,
            action: "RADIOLOGY_ORDER_CREATED",
            entityType: "RadiologyOrder",
            entityId: order.id,
            details: {
                accessionNo: order.accessionNo,
                modality: order.modality,
                priority: order.priority,
            },
        });

        return order;
    });
}

// List and filter radiology orders.
async function listOrders(query) {
    const {
        page,
        limit,
        patientId,
        appointmentId,
        modality,
        priority,
        status,
    } = query;

    const where = {
        ...(patientId ? { patientId } : {}),
        ...(appointmentId ? { appointmentId } : {}),
        ...(modality ? { modality } : {}),
        ...(priority ? { priority } : {}),
        ...(status ? { status } : {}),
    };

    const [orders, total] = await prisma.$transaction([
        prisma.radiologyOrder.findMany({
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
                appointment: true,
                report: true,
            },
            orderBy: { orderedAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),

        prisma.radiologyOrder.count({ where }),
    ]);

    return {
        orders,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}

// Retrieve one order by its internal ID.
async function getOrderById(id) {
    return prisma.radiologyOrder.findUnique({
        where: { id },
        include: {
            patient: true,
            appointment: true,
            report: true,
            studyLink: true,
        },
    });
}

// Initial MVP status transition rules.
const allowedTransitions = {
    ORDERED: ["SCHEDULED", "IN_PROGRESS", "CANCELLED"],
    SCHEDULED: ["IN_PROGRESS", "CANCELLED"],
    IN_PROGRESS: ["COMPLETED", "CANCELLED"],
    COMPLETED: [],
    CANCELLED: [],
};

// Change order status and record the transition.
async function changeOrderStatus(id, status, actorId) {
    return prisma.$transaction(async (tx) => {
        const existing = await tx.radiologyOrder.findUnique({
            where: { id },
        });

        if (!existing) {
            throw createServiceError(404, "Radiology order not found");
        }

        const allowed = allowedTransitions[existing.status] || [];

        if (!allowed.includes(status)) {
            throw createServiceError(
                409,
                `Invalid order status transition from ${existing.status} to ${status}`
            );
        }

        const order = await tx.radiologyOrder.update({
            where: { id },
            data: { status },
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
            action: "RADIOLOGY_ORDER_STATUS_CHANGED",
            entityType: "RadiologyOrder",
            entityId: order.id,
            details: {
                previousStatus: existing.status,
                newStatus: status,
            },
        });

        return order;
    });
}

// Explicitly permitted administrative correction transitions.
// These rules apply only to the override endpoint.
const allowedOverrideTransitions = {
    ORDERED: [
        "SCHEDULED",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED",
    ],
    SCHEDULED: [
        "ORDERED",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED",
    ],
    IN_PROGRESS: [
        "SCHEDULED",
        "COMPLETED",
        "CANCELLED",
    ],
    COMPLETED: [
        "IN_PROGRESS",
    ],
    CANCELLED: [
        "ORDERED",
        "SCHEDULED",
        "IN_PROGRESS",
    ],
};

// Correct an order status under administrator-only authorization.
// Every override requires a reason and creates an audit event.
async function overrideOrderStatus(id, status, reason, actorId) {
    return prisma.$transaction(async (tx) => {
        // Verify the actor's current role inside the transaction too.
        const actor = await tx.user.findUnique({
            where: { id: actorId },
            select: {
                id: true,
                role: true,
                active: true,
            },
        });

        if (!actor || !actor.active) {
            throw createServiceError(
                401,
                "Administrator account is unavailable"
            );
        }

        if (actor.role !== "ADMIN") {
            throw createServiceError(
                403,
                "Only an active administrator can override order status"
            );
        }

        const existing = await tx.radiologyOrder.findUnique({
            where: { id },
        });

        if (!existing) {
            throw createServiceError(
                404,
                "Radiology order not found"
            );
        }

        if (existing.status === status) {
            throw createServiceError(
                409,
                "The order already has the requested status"
            );
        }

        const allowed =
            allowedOverrideTransitions[existing.status] || [];

        if (!allowed.includes(status)) {
            throw createServiceError(
                409,
                `Override from ${existing.status} to ${status} is not permitted`
            );
        }

        // Only update if the order still has the status we just read.
        // This prevents silently overwriting a concurrent status change.
        const updateResult = await tx.radiologyOrder.updateMany({
            where: {
                id,
                status: existing.status,
            },
            data: {
                status,
            },
        });

        if (updateResult.count !== 1) {
            throw createServiceError(
                409,
                "The order status changed concurrently. Reload and try again."
            );
        }

        const updatedOrder = await tx.radiologyOrder.findUnique({
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
            },
        });

        await recordAudit(tx, {
            actorId,
            action: "RADIOLOGY_ORDER_STATUS_OVERRIDDEN",
            entityType: "RadiologyOrder",
            entityId: id,
            details: {
                accessionNo: existing.accessionNo,
                previousStatus: existing.status,
                newStatus: status,
                reason: reason.trim(),
            },
        });

        return updatedOrder;
    });
}

module.exports = {
  createOrder,
  listOrders,
  getOrderById,
  changeOrderStatus,
  overrideOrderStatus,
};