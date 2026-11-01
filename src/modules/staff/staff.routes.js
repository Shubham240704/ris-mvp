
const express = require("express");

const { authenticate } = require("../../middleware/auth.middleware");
const { authorize } = require("../../middleware/authorize.middleware");

const {
    validateBody,
    validateQuery,
} = require("../../middleware/validate.middleware");

const {
    createInvitationSchema,
    listInvitationsSchema,
} = require("./staff.schema");

const controller = require("./staff.controller");

const router = express.Router();

// All staff management endpoints require an active administrator.
router.use(authenticate);
router.use(authorize("ADMIN"));

// Create a new staff invitation.
router.post(
    "/invitations",
    validateBody(createInvitationSchema),
    controller.createInvitation
);

// List and filter staff invitations.
router.get(
    "/invitations",
    validateQuery(listInvitationsSchema),
    controller.listInvitations
);

// Revoke a pending invitation.
router.patch(
    "/invitations/:id/revoke",
    controller.revokeInvitation
);

module.exports = router;
