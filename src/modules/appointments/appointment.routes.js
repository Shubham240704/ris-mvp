const express = require("express");

const { authenticate } = require("../../middleware/auth.middleware");
const { authorize } = require("../../middleware/authorize.middleware");

const {
    validateBody,
    validateQuery,
} = require("../../middleware/validate.middleware");

const {
    createAppointmentSchema,
    updateAppointmentSchema,
    updateAppointmentStatusSchema,
    listAppointmentsSchema,
} = require("./appointment.schema");

const controller = require("./appointment.controller");

const router = express.Router();

// All appointment endpoints require authentication.
router.use(authenticate);

// GET /api/appointments
router.get(
    "/",
    validateQuery(listAppointmentsSchema),
    controller.listAppointments
);

// GET /api/appointments/:id
router.get("/:id", controller.getAppointment);

// POST /api/appointments
router.post(
    "/",
    authorize("ADMIN", "RECEPTIONIST"),
    validateBody(createAppointmentSchema),
    controller.createAppointment
);

// PATCH /api/appointments/:id
router.patch(
    "/:id",
    authorize("ADMIN", "RECEPTIONIST"),
    validateBody(updateAppointmentSchema),
    controller.updateAppointment
);

// PATCH /api/appointments/:id/status
router.patch(
    "/:id/status",
    authorize("ADMIN", "RECEPTIONIST", "TECHNICIAN"),
    validateBody(updateAppointmentStatusSchema),
    controller.updateAppointmentStatus
);

module.exports = router;