require("dotenv").config();

const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
    const name = process.env.SEED_ADMIN_NAME;
    const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.SEED_ADMIN_PASSWORD;

    if (!name || !email || !password) {
        throw new Error("Missing administrator seed configuration.");
    }

    if (password.length < 12) {
        throw new Error(
            "The seed administrator password must be at least 12 characters."
        );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        const updatedUser = await prisma.user.update({
            where: { email },
            data: {
                name,
                passwordHash,
                role: "ADMIN",
                active: true,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
            },
        });

        console.log("Administrator updated:", updatedUser);
        return;
    }

    const user = await prisma.user.create({
        data: {
            name,
            email,
            passwordHash,
            role: "ADMIN",
            active: true,
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
        },
    });

    console.log("Administrator created:", user);
}

main()
    .catch((error) => {
        console.error("Administrator seed failed:", error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });