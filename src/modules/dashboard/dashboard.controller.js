
const dashboardService = require("./dashboard.service");

// GET /api/dashboard/summary
async function getDashboardSummary(req, res, next) {
    try {
        const summary = await dashboardService.getDashboardSummary();

        return res.status(200).json({
            success: true,
            data: summary,
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getDashboardSummary,
};
