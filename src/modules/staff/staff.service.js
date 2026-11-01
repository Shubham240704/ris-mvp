
const crypto = require("crypto");
const bcrypt = require("bcrypt");

const { prisma } = require("../../config/prisma");
const { recordAudit } = require("../../services/audit.service");

const INVITATION_EXPIRY_HOURS = 24;

function createServiceError(statusCode, message) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

// Only active administrators can manage staff invitations.
async function verifyAdmin(tx, actorId) {
    const actor = await tx.user.findUnique({
        where: { id: actorId },
        select: {
            id: true,
            role: true,
            active: true,
        },
    });

    if (!actor || !actor.active) {
        throw createServiceError(401, "Administrator account unavailable");
    }

    if (actor.role !== "ADMIN") {
        throw createServiceError(403, "Administrator permission required");
    }

    return actor;
}

// Hash invitation tokens before database storage.
function hashToken(token) {
    return crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
}

// Fields safe to return to administrators.
const invitationSelect = {
    id: true,
    name: true,
    email: true,
    role: true,
    status: true,
    expiresAt: true,
    acceptedAt: true,
    revokedAt: true,
    invitedById: true,
    createdAt: true,
    updatedAt: true,
};

// Mark expired pending invitations and record their expiration.
async function expirePendingInvitations(tx, where) {
    const invitations = await tx.staffInvitation.findMany({
        where: {
            ...where,
            status: "PENDING",
            expiresAt: { lte: new Date() },
        },
        select: {
            id: true,
            email: true,
            role: true,
        },
    });

    for (const invitation of invitations) {
        const result = await tx.staffInvitation.updateMany({
            where: {
                id: invitation.id,
                status: "PENDING",
                expiresAt: { lte: new Date() },
            },
            data: {
                status: "EXPIRED",
            },
        });

        if (result.count === 1) {
            await recordAudit(tx, {
                actorId: null,
                action: "STAFF_INVITATION_EXPIRED",
                entityType: "StaffInvitation",
                entityId: invitation.id,
                details: {
                    email: invitation.email,
                    role: invitation.role,
                },
            });
        }
    }
}

// Create an invitation for a new staff member.
async function createInvitation(data, actorId) {
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(token);

    const expiresAt = new Date(
        Date.now() + INVITATION_EXPIRY_HOURS * 60 * 60 * 1000
    );

    try {
        return await prisma.$transaction(async (tx) => {
            await verifyAdmin(tx, actorId);

            const email = data.email.trim().toLowerCase();

            const existingUser = await tx.user.findUnique({
                where: { email },
                select: { id: true },
            });

            if (existingUser) {
                throw createServiceError(
                    409,
                    "A staff account with this email already exists"
                );
            }

            await expirePendingInvitations(tx, { email });

            const existingInvitation =
                await tx.staffInvitation.findFirst({
                    where: {
                        email,
                        status: "PENDING",
                        expiresAt: { gt: new Date() },
                    },
                    select: { id: true },
                });

            if (existingInvitation) {
                throw createServiceError(
                    409,
                    "An active invitation already exists for this email"
                );
            }

            const invitation = await tx.staffInvitation.create({
                data: {
                    name: data.name,
                    email,
                    role: data.role,
                    tokenHash,
                    expiresAt,
                    invitedById: actorId,
                },
                select: invitationSelect,
            });

            await recordAudit(tx, {
                actorId,
                action: "STAFF_INVITATION_CREATED",
                entityType: "StaffInvitation",
                entityId: invitation.id,
                details: {
                    email: invitation.email,
                    role: invitation.role,
                    expiresAt: invitation.expiresAt.toISOString(),
                },
            });

            // Raw token is returned once, never stored in the database.
            return {
                invitation,
                token,
            };
        });
    } catch (error) {
        if (error.code === "P2002") {
            throw createServiceError(
                409,
                "An invitation already exists"
            );
        }

        throw error;
    }
}

// List invitations with pagination and filtering.
async function listInvitations(query, actorId) {
    return prisma.$transaction(async (tx) => {
        await verifyAdmin(tx, actorId);

        // Update expired invitations before returning the list.
        await expirePendingInvitations(tx, {});

        const { page, limit, status, email } = query;

        const where = {
            ...(status ? { status } : {}),
            ...(email ? { email } : {}),
        };

        const [invitations, total] = await Promise.all([
            tx.staffInvitation.findMany({
                where,
                select: {
                    ...invitationSelect,
                    invitedBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),

            tx.staffInvitation.count({ where }),
        ]);

        return {
            invitations,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    });
}

// Revoke an unused invitation.
async function revokeInvitation(id, actorId) {
    return prisma.$transaction(async (tx) => {
        await verifyAdmin(tx, actorId);

        await expirePendingInvitations(tx, { id });

        const existing = await tx.staffInvitation.findUnique({
            where: { id },
        });

        if (!existing) {
            throw createServiceError(404, "Invitation not found");
        }

        if (existing.status !== "PENDING") {
            throw createServiceError(
                409,
                "Only pending invitations can be revoked"
            );
        }

        const result = await tx.staffInvitation.updateMany({
            where: {
                id,
                status: "PENDING",
                expiresAt: { gt: new Date() },
            },
            data: {
                status: "REVOKED",
                revokedAt: new Date(),
            },
        });

        if (result.count !== 1) {
            throw createServiceError(
                409,
                "Invitation status changed. Reload and try again."
            );
        }

        const invitation = await tx.staffInvitation.findUnique({
            where: { id },
            select: invitationSelect,
        });

        await recordAudit(tx, {
            actorId,
            action: "STAFF_INVITATION_REVOKED",
            entityType: "StaffInvitation",
            entityId: id,
            details: {
                email: existing.email,
                role: existing.role,
            },
        });

        return invitation;
    });
}

// Accept an invitation and create the staff account.
async function acceptInvitation(data) {
    const tokenHash = hashToken(data.token);

    // Hash the password before opening the database transaction.
    const passwordHash = await bcrypt.hash(data.password, 12);

    try {
        return await prisma.$transaction(async (tx) => {
            await expirePendingInvitations(tx, { tokenHash });

            const invitation = await tx.staffInvitation.findUnique({
                where: { tokenHash },
            });

            if (!invitation) {
                throw createServiceError(
                    400,
                    "Invalid invitation token"
                );
            }

            if (invitation.status === "EXPIRED") {
                throw createServiceError(
                    410,
                    "Invitation has expired"
                );
            }

            if (invitation.status !== "PENDING") {
                throw createServiceError(
                    409,
                    "Invitation has already been used or revoked"
                );
            }

            if (invitation.expiresAt <= new Date()) {
                throw createServiceError(
                    410,
                    "Invitation has expired"
                );
            }

            const existingUser = await tx.user.findUnique({
                where: { email: invitation.email },
                select: { id: true },
            });

            if (existingUser) {
                throw createServiceError(
                    409,
                    "A staff account with this email already exists"
                );
            }

            // Atomically claim the invitation.
            const claimed = await tx.staffInvitation.updateMany({
                where: {
                    id: invitation.id,
                    status: "PENDING",
                    expiresAt: { gt: new Date() },
                },
                data: {
                    status: "ACCEPTED",
                    acceptedAt: new Date(),
                },
            });

            if (claimed.count !== 1) {
                throw createServiceError(
                    409,
                    "Invitation could not be accepted. It may already have been used."
                );
            }

            // Create the account using the role assigned by the administrator.
            const user = await tx.user.create({
                data: {
                    name: invitation.name,
                    email: invitation.email,
                    passwordHash,
                    role: invitation.role,
                    active: true,
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    active: true,
                    createdAt: true,
                },
            });

            await recordAudit(tx, {
                actorId: user.id,
                action: "STAFF_INVITATION_ACCEPTED",
                entityType: "StaffInvitation",
                entityId: invitation.id,
                details: {
                    userId: user.id,
                    email: user.email,
                    role: user.role,
                    invitedById: invitation.invitedById,
                },
            });

            return user;
        });
    } catch (error) {
        if (error.code === "P2002") {
            throw createServiceError(
                409,
                "A staff account with this email already exists"
            );
        }

        throw error;
    }
}

module.exports = {
    createInvitation,
    listInvitations,
    revokeInvitation,
    acceptInvitation,
};
