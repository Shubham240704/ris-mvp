const { port } = require("./config/env");
const app = require("./app");
const { prisma } = require("./config/prisma");

const server = app.listen(port, () => {
    console.log(`RIS API listening on http://localhost:${port}`);
});

async function shutdown() {
    console.log("Shutting down RIS API...");

    server.close(async () => {
        try {
            await prisma.$disconnect();
            console.log("Database connection closed.");
        } catch (error) {
            console.error("Shutdown failed:", error.message);
            process.exitCode = 1;
        }
    });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);