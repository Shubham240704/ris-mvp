const appointmentService = require("./appointment.service");

// POST /api/appointments
async function createAppointment(req, res, next) {
    try {
        const appointment = await appointmentService.createAppointment(
            req.validatedBody,
            req.user.id
        );

        return res.status(201).json({
            success: true,
            data: appointment,
        });
    } catch (error) {
        next(error);
    }
}

// GET /api/appointments
async function listAppointments(req, res, next) {
    try {
        const result = await appointmentService.listAppointments(
            req.validatedQuery
        );

        return res.status(200).json({
            success: true,
            data: result.appointments,
            pagination: result.pagination,
        });
    } catch (error) {
        next(error);
    }
}

// GET /api/appointments/:id
async function getAppointment(req, res, next) {
    try {
        const appointment = await appointmentService.getAppointmentById(
            req.params.id
        );

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: appointment,
        });
    } catch (error) {
        next(error);
    }
}

// PATCH /api/appointments/:id
async function updateAppointment(req, res, next) {
    try {
        const appointment = await appointmentService.updateAppointment(
            req.params.id,
            req.validatedBody,
            req.user.id
        );

        return res.status(200).json({
            success: true,
            data: appointment,
        });
    } catch (error) {
        next(error);
    }
}

// PATCH /api/appointments/:id/status
async function updateAppointmentStatus(req, res, next) {
    try {
        const appointment =
            await appointmentService.changeAppointmentStatus(
                req.params.id,
                req.validatedBody.status,
                req.user.id
            );

        return res.status(200).json({
            success: true,
            data: appointment,
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createAppointment,
    listAppointments,
    getAppointment,
    updateAppointment,
    updateAppointmentStatus,
};