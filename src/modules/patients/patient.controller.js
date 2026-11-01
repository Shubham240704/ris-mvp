const patientService = require("./patient.service");

async function createPatient(req, res, next) {
    try {
        const patient = await patientService.createPatient(
            req.validatedBody,
            req.user.id
        );

        return res.status(201).json({
            success: true,
            data: patient,
        });
    } catch (error) {
        next(error);
    }
}

async function listPatients(req, res, next) {
    try {
        const result = await patientService.listPatients(
            req.validatedQuery
        );

        return res.status(200).json({
            success: true,
            data: result.patients,
            pagination: result.pagination,
        });
    } catch (error) {
        next(error);
    }
}

async function getPatient(req, res, next) {
    try {
        const patient = await patientService.getPatientById(
            req.params.id
        );

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: patient,
        });
    } catch (error) {
        next(error);
    }
}

async function updatePatient(req, res, next) {
    try {
        const patient = await patientService.updatePatient(
            req.params.id,
            req.validatedBody,
            req.user.id
        );

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: patient,
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createPatient,
    listPatients,
    getPatient,
    updatePatient,
};