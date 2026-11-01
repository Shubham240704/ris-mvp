
const staffService = require("./staff.service");

// POST /api/staff/invitations
async function createInvitation(req, res, next) {
    try {
        const result = await staffService.createInvitation(
            req.validatedBody,
            req.user.id
        );

        const frontendUrl = (
            process.env.FRONTEND_BASE_URL || "http://localhost:5173"
        ).replace(/\/+$/, "");

        const invitationUrl =
            `${frontendUrl}/accept-invitation?token=${encodeURIComponent(result.token)}`;

        return res.status(201).json({
            success: true,
            message: "Staff invitation created successfully. Copy and share the invitation link.",
            data: {
                invitation: result.invitation,
                invitationUrl,
            },
        });
    } catch (error) {
        next(error);
    }
}

// GET /api/staff/invitations
async function listInvitations(req, res, next) {
    try {
        const result = await staffService.listInvitations(
            req.validatedQuery,
            req.user.id
        );

        return res.status(200).json({
            success: true,
            data: result.invitations,
            pagination: result.pagination,
        });
    } catch (error) {
        next(error);
    }
}

// PATCH /api/staff/invitations/:id/revoke
async function revokeInvitation(req, res, next) {
    try {
        const invitation = await staffService.revokeInvitation(
            req.params.id,
            req.user.id
        );

        return res.status(200).json({
            success: true,
            message: "Staff invitation revoked successfully",
            data: invitation,
        });
    } catch (error) {
        next(error);
    }
}

// POST /api/auth/accept-invitation
async function acceptInvitation(req, res, next) {
    try {
        const user = await staffService.acceptInvitation(
            req.validatedBody
        );

        return res.status(201).json({
            success: true,
            message: "Staff account activated successfully. Please log in.",
            data: user,
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createInvitation,
    listInvitations,
    revokeInvitation,
    acceptInvitation,
};
