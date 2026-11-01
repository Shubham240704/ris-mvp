const crypto = require("crypto");
const { prisma } = require("../../config/prisma");
const { recordAudit } = require("../../services/audit.service");

function createConflictError(message) {
    const error = new Error(message);
    error.statusCode = 409;
    return error;
}

async function findPotentialDuplicate(db, data, excludeId) {
    const where = {
        firstName: {
            equals: data.firstName,
            mode: "insensitive",
        },
        lastName: {
            equals: data.lastName,
            mode: "insensitive",
        },
        dateOfBirth: data.dateOfBirth,
        ...(excludeId ? { id: { not: excludeId } } : {}),
    };

    return db.patient.findFirst({
        where,
        select: { id: true },
    });
}

async function createPatient(data, actorId) {
    return prisma.$transaction(async (tx) => {
        const duplicate = await findPotentialDuplicate(tx, data);

        if (duplicate) {
            throw createConflictError(
                "A patient with the same name and date of birth may already exist. Check existing records before creating another."
            );
        }

        const patient = await tx.patient.create({
            data: {
                ...data,
                patientNumber: `PAT-${crypto.randomUUID()
                    .slice(0, 8)
                    .toUpperCase()}`,
            },
        });

        await recordAudit(tx, {
            actorId,
            action: "PATIENT_CREATED",
            entityType: "Patient",
            entityId: patient.id,
            details: {
                changedFields: [
                    "firstName",
                    "lastName",
                    "dateOfBirth",
                ],
            },
        });

        return patient;
    });
}

async function listPatients({ page, limit, search }) {
    const where = search
        ? {
            OR: [
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
                { patientNumber: { contains: search, mode: "insensitive" } },
            ],
        }
        : {};

    const [patients, total] = await prisma.$transaction([
        prisma.patient.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: "desc" },
        }),
        prisma.patient.count({ where }),
    ]);

    return {
        patients,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}

async function getPatientById(id) {
    return prisma.patient.findUnique({
        where: { id },
        include: {
            appointments: {
                orderBy: { scheduledAt: "desc" },
            },
            orders: {
                orderBy: { orderedAt: "desc" },
            },
        },
    });
}

async function updatePatient(id, data, actorId) {
    return prisma.$transaction(async (tx) => {
        const existing = await tx.patient.findUnique({
            where: { id },
        });

        if (!existing) {
            return null;
        }

        const duplicate = await findPotentialDuplicate(tx, {
            firstName: data.firstName ?? existing.firstName,
            lastName: data.lastName ?? existing.lastName,
            dateOfBirth: data.dateOfBirth ?? existing.dateOfBirth,
        }, id);

        if (duplicate) {
            throw createConflictError(
                "These details match another patient. Check existing records before updating."
            );
        }

        const patient = await tx.patient.update({
            where: { id },
            data,
        });

        await recordAudit(tx, {
            actorId,
            action: "PATIENT_UPDATED",
            entityType: "Patient",
            entityId: patient.id,
            details: {
                changedFields: Object.keys(data),
            },
        });

        return patient;
    });
}

module.exports = {
    createPatient,
    listPatients,
    getPatientById,
    updatePatient,
};