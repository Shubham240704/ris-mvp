async function recordAudit(db, {
    actorId,
    action,
    entityType,
    entityId,
    details,
}) {
    return db.auditEvent.create({
        data: {
            actorId,
            action,
            entityType,
            entityId,
            ...(details ? { details } : {}),
        },
    });
}

module.exports = { recordAudit };