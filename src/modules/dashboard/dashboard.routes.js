
const express = require("express");

const { authenticate } = require("../../middleware/auth.middleware");
const { authorize } = require("../../middleware/authorize.middleware");

const controller = require("./dashboard.controller");

const router = express.Router();

// All dashboard endpoints require an authenticated staff account.
router.use(authenticate);

// GET /api/dashboard/summary
router.get(
    "/summary",
    authorize(
        "ADMIN",
        "RECEPTIONIST",
        "RADIOLOGIST",
        "TECHNICIAN",
        "PHARMACIST"
    ),
    controller.getDashboardSummary
);

module.exports = router;
