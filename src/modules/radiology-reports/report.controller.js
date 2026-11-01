
const reportService = require("./report.service");

// POST /api/radiology-reports
async function createReport(req, res, next) {
    try {
        const report = await reportService.createReport(
            req.validatedBody,
            req.user.id
        );

        return res.status(201).json({
            success: true,
            data: report,
        });
    } catch (error) {
        next(error);
    }
}

// GET /api/radiology-reports
async function listReports(req, res, next) {
    try {
        const result = await reportService.listReports(
            req.validatedQuery
        );

        return res.status(200).json({
            success: true,
            data: result.reports,
            pagination: result.pagination,
        });
    } catch (error) {
        next(error);
    }
}

// GET /api/radiology-reports/:id
async function getReport(req, res, next) {
    try {
        const report = await reportService.getReportById(
            req.params.id
        );

        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Radiology report not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: report,
        });
    } catch (error) {
        next(error);
    }
}

// PATCH /api/radiology-reports/:id
async function updateReport(req, res, next) {
    try {
        const report = await reportService.updateReport(
            req.params.id,
            req.validatedBody,
            req.user.id
        );

        return res.status(200).json({
            success: true,
            data: report,
        });
    } catch (error) {
        next(error);
    }
}

// PATCH /api/radiology-reports/:id/review
async function reviewReport(req, res, next) {
    try {
        const report = await reportService.reviewReport(
            req.params.id,
            req.user.id
        );

        return res.status(200).json({
            success: true,
            message: "Radiology report reviewed successfully",
            data: report,
        });
    } catch (error) {
        next(error);
    }
}

// PATCH /api/radiology-reports/:id/finalize
async function finalizeReport(req, res, next) {
    try {
        const report = await reportService.finalizeReport(
            req.params.id,
            req.user.id
        );

        return res.status(200).json({
            success: true,
            message: "Radiology report finalized successfully",
            data: report,
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createReport,
    listReports,
    getReport,
    updateReport,
    reviewReport,
    finalizeReport,
};
