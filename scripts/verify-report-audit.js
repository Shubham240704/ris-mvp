
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const reportId = "7e722205-259b-462c-972b-7a7690a3b0ef";

async function main() {
    const events = await prisma.auditEvent.findMany({
        where: {
            entityType: "RadiologyReport",
            entityId: reportId,
        },
        select: {
            action: true,
            actorId: true,
            entityId: true,
            createdAt: true,
            details: true,
        },
        orderBy: {
            createdAt: "asc",
        },
    });

    console.log("Radiology Report Audit History:");
    console.table(
        events.map((event) => ({
            action: event.action,
            actorId: event.actorId,
            createdAt: event.createdAt,
        }))
    );

    console.log("Total report audit events:", events.length);
}

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
