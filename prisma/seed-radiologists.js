
require("dotenv").config();

const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
    if (process.env.NODE_ENV === "production") {
        throw new Error(
            "Radiologist demo seeding is disabled in production."
        );
    }

    const radiologists = [
        {
            name: process.env.SEED_RADIOLOGIST_AUTHOR_NAME,
            email: process.env.SEED_RADIOLOGIST_AUTHOR_EMAIL
                ?.trim()
                .toLowerCase(),
            password: process.env.SEED_RADIOLOGIST_AUTHOR_PASSWORD,
        },
        {
            name: process.env.SEED_RADIOLOGIST_REVIEWER_NAME,
            email: process.env.SEED_RADIOLOGIST_REVIEWER_EMAIL
                ?.trim()
                .toLowerCase(),
            password: process.env.SEED_RADIOLOGIST_REVIEWER_PASSWORD,
        },
    ];

    for (const user of radiologists) {
        if (!user.name || !user.email || !user.password) {
            throw new Error(
                "Missing radiologist seed configuration."
            );
        }

        if (user.password.length < 12) {
            throw new Error(
                "Radiologist passwords must contain at least 12 characters."
            );
        }
    }

    if (radiologists[0].email === radiologists[1].email) {
        throw new Error(
            "Author and reviewer must have different email addresses."
        );
    }

    if (radiologists[0].password === radiologists[1].password) {
        throw new Error(
            "Author and reviewer must have different passwords."
        );
    }

    const results = await prisma.$transaction(async (tx) => {
        const provisionedUsers = [];

        for (const user of radiologists) {
            const existingUser = await tx.user.findUnique({
                where: { email: user.email },
            });

            if (existingUser) {
                if (existingUser.role !== "RADIOLOGIST") {
                    throw new Error(
                        `${user.email} already exists with role ${existingUser.role}. Refusing to change its role.`
                    );
                }

                const updatedUser = await tx.user.update({
                    where: { id: existingUser.id },
                    data: {
                        name: user.name,
                        active: true,
                    },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        active: true,
                    },
                });

                provisionedUsers.push(updatedUser);
                continue;
            }

            const passwordHash = await bcrypt.hash(
                user.password,
                12
            );

            const createdUser = await tx.user.create({
                data: {
                    name: user.name,
                    email: user.email,
                    passwordHash,
                    role: "RADIOLOGIST",
                    active: true,
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    active: true,
                },
            });

            provisionedUsers.push(createdUser);
        }

        return provisionedUsers;
    });

    console.log("Radiologist accounts provisioned:");

    results.forEach((user) => {
        console.log(user);
    });
}

main()
    .catch((error) => {
        console.error(
            "Radiologist seed failed:",
            error.message
        );
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
