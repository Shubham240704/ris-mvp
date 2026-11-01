const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
    const [
        invitations,
        users,
        patients,
        appointments,
        orders,
        reports,
        audits,
    ] = await Promise.all([
        prisma.staffInvitation.count(),
        prisma.user.count(),
        prisma.patient.count(),
        prisma.appointment.count(),
        prisma.radiologyOrder.count(),
        prisma.radiologyReport.count(),
        prisma.auditEvent.count(),
    ]);

    console.table({
        invitations,
        users,
        patients,
        appointments,
        orders,
        reports,
        audits,
    });
}

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
