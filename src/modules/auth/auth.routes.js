const express = require("express");
const { rateLimit } = require("express-rate-limit");

const { validateBody } = require("../../middleware/validate.middleware");
const { authenticate } = require("../../middleware/auth.middleware");
const { loginSchema } = require("./auth.schema");

const {
    acceptInvitationSchema,
} = require("../staff/staff.schema");

const {
    login,
    getCurrentUser,
} = require("./auth.controller");

const {
    acceptInvitation,
} = require("../staff/staff.controller");

const router = express.Router();

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many login attempts. Please try again later.",
    },
});

const invitationAcceptanceLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many invitation attempts. Please try again later.",
    },
});

router.post(
    "/accept-invitation",
    invitationAcceptanceLimiter,
    validateBody(acceptInvitationSchema),
    acceptInvitation
);
router.post("/login", loginLimiter, validateBody(loginSchema), login);
router.get("/me", authenticate, getCurrentUser);

module.exports = router;