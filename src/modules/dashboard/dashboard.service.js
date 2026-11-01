
const { prisma } = require("../../config/prisma");

// Calculate the current day's boundaries using the server's local timezone.
function getTodayRange() {
    const now = new Date();

    const start = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
    );

    const end = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1
    );

    return { gte: start, lt: end };
}

async function getDashboardSummary() {
    const now = new Date();
    const todayRange = getTodayRange();

    const [
        totalPatients,
        appointmentsToday,
        pendingOrders,
        completedExams,
        pendingReports,
        finalizedReports,
        upcomingAppointments,
    ] = await prisma.$transaction([
        // Total registered patients
        prisma.patient.count(),

        // Appointments scheduled today, excluding cancellations
        prisma.appointment.count({
            where: {
                scheduledAt: todayRange,
                status: { not: "CANCELLED" },
            },
        }),

        // Orders awaiting or undergoing examination
        prisma.radiologyOrder.count({
            where: {
                status: {
                    in: ["ORDERED", "SCHEDULED", "IN_PROGRESS"],
                },
            },
        }),

        // All completed radiology examinations
        prisma.radiologyOrder.count({
            where: { status: "COMPLETED" },
        }),

        // Reports awaiting finalization
        prisma.radiologyReport.count({
            where: {
                status: {
                    in: ["DRAFT", "REVIEWED"],
                },
            },
        }),

        // Finalized reports
        prisma.radiologyReport.count({
            where: { status: "FINALIZED" },
        }),

        // Next five upcoming appointments
        prisma.appointment.findMany({
            where: {
                scheduledAt: { gte: now },
                status: {
                    in: ["SCHEDULED", "CONFIRMED", "CHECKED_IN"],
                },
            },
            select: {
                id: true,
                scheduledAt: true,
                modality: true,
                procedure: true,
                status: true,
                patient: {
                    select: {
                        id: true,
                        patientNumber: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: {
                scheduledAt: "asc",
            },
            take: 5,
        }),
    ]);

    return {
        statistics: {
            totalPatients,
            appointmentsToday,
            pendingOrders,
            completedExams,
            pendingReports,
            finalizedReports,
        },
        upcomingAppointments,
        generatedAt: now.toISOString(),
    };
}

module.exports = {
    getDashboardSummary,
};
