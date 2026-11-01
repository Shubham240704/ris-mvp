
const express = require("express");

const { authenticate } = require("../../middleware/auth.middleware");
const { authorize } = require("../../middleware/authorize.middleware");

const {
    validateBody,
    validateQuery,
} = require("../../middleware/validate.middleware");

const {
    createReportSchema,
    updateReportSchema,
    listReportsSchema,
} = require("./report.schema");

const controller = require("./report.controller");

const router = express.Router();

// All report endpoints require authentication.
router.use(authenticate);

// List reports: administrators and radiologists.
router.get(
    "/",
    authorize("ADMIN", "RADIOLOGIST"),
    validateQuery(listReportsSchema),
    controller.listReports
);

// Retrieve an individual report.
router.get(
    "/:id",
    authorize("ADMIN", "RADIOLOGIST"),
    controller.getReport
);

// Create reports: radiologists only.
router.post(
    "/",
    authorize("RADIOLOGIST"),
    validateBody(createReportSchema),
    controller.createReport
);

// Edit draft reports: radiologists only.
// The service also verifies report ownership.
router.patch(
    "/:id",
    authorize("RADIOLOGIST"),
    validateBody(updateReportSchema),
    controller.updateReport
);

// Review reports: radiologists only.
router.patch(
    "/:id/review",
    authorize("RADIOLOGIST"),
    controller.reviewReport
);

// Finalize reviewed reports: radiologists only.
router.patch(
    "/:id/finalize",
    authorize("RADIOLOGIST"),
    controller.finalizeReport
);

module.exports = router;
