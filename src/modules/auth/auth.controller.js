const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { prisma } = require("../../config/prisma");

async function login(req, res, next) {
    try {
        const { email, password } = req.validatedBody;

        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (
            !user ||
            !user.active ||
            !(await bcrypt.compare(password, user.passwordHash))
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const token = jwt.sign(
            {},
            process.env.JWT_SECRET,
            {
                subject: user.id,
                expiresIn: process.env.JWT_EXPIRES_IN || "1h",
                issuer: "ris-mvp",
                audience: "ris-mvp-api",
            }
        );

        await prisma.auditEvent.create({
            data: {
                actorId: user.id,
                action: "AUTH_LOGIN_SUCCESS",
                entityType: "User",
                entityId: user.id,
            },
        });

        return res.status(200).json({
            success: true,
            data: {
                accessToken: token,
                tokenType: "Bearer",
                expiresIn: process.env.JWT_EXPIRES_IN || "1h",
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            },
        });
    } catch (error) {
        next(error);
    }
}

function getCurrentUser(req, res) {
    const { id, name, email, role } = req.user;

    return res.status(200).json({
        success: true,
        data: { id, name, email, role },
    });
}

module.exports = { login, getCurrentUser };