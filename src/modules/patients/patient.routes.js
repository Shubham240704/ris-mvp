const express = require("express");

const { authenticate } = require("../../middleware/auth.middleware");
const { authorize } = require("../../middleware/authorize.middleware");
const {
    validateBody,
    validateQuery,
} = require("../../middleware/validate.middleware");

const {
    createPatientSchema,
    updatePatientSchema,
    listPatientsSchema,
} = require("./patient.schema");

const controller = require("./patient.controller");

const router = express.Router();

// Every patient route requires authentication.
router.use(authenticate);

// Register a patient.
router.post(
    "/",
    authorize("ADMIN", "RECEPTIONIST"),
    validateBody(createPatientSchema),
    controller.createPatient
);

// List and search patients.
router.get(
    "/",
    validateQuery(listPatientsSchema),
    controller.listPatients
);

// Get patient details and associated appointments/orders.
router.get("/:id", controller.getPatient);

// Update an existing patient.
router.patch(
    "/:id",
    authorize("ADMIN", "RECEPTIONIST"),
    validateBody(updatePatientSchema),
    controller.updatePatient
);

module.exports = router;