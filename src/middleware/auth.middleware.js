const jwt = require("jsonwebtoken");
const { prisma } = require("../config/prisma");

async function authenticate(req, res, next) {
    const authorization = req.headers.authorization;

    if (
        !authorization ||
        !authorization.startsWith("Bearer ")
    ) {
        return res.status(401).json({
            success: false,
            message: "Authentication required",
        });
    }

    const token = authorization.slice(7);
    let payload;

    try {
        payload = jwt.verify(token, process.env.JWT_SECRET, {
            issuer: "ris-mvp",
            audience: "ris-mvp-api",
        });
    } catch {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired authentication token",
        });
    }

    if (typeof payload !== "object" || !payload.sub) {
        return res.status(401).json({
            success: false,
            message: "Invalid authentication token",
        });
    }

    try {
        // Read the current user and role from the database instead
        // of trusting role information embedded in an old token.
        const user = await prisma.user.findUnique({
            where: { id: payload.sub },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                active: true,
            },
        });

        if (!user || !user.active) {
            return res.status(401).json({
                success: false,
                message: "User is unavailable or inactive",
            });
        }

        req.user = user;
        next();
    } catch (error) {
        next(error);
    }
}

module.exports = { authenticate };