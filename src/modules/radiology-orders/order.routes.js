const express = require("express");

const { authenticate } = require("../../middleware/auth.middleware");
const { authorize } = require("../../middleware/authorize.middleware");

const {
    validateBody,
    validateQuery,
} = require("../../middleware/validate.middleware");

const {
    createOrderSchema,
    updateOrderStatusSchema,
    orderStatusOverrideSchema,
    listOrdersSchema,
} = require("./order.schema");

const controller = require("./order.controller");

const router = express.Router();

// All radiology order endpoints require authentication.
router.use(authenticate);

// GET /api/radiology-orders
router.get(
    "/",
    validateQuery(listOrdersSchema),
    controller.listOrders
);

// GET /api/radiology-orders/:id
router.get("/:id", controller.getOrder);

// POST /api/radiology-orders
// Only authorized administrative or reception staff can create orders.
router.post(
    "/",
    authorize("ADMIN", "RECEPTIONIST"),
    validateBody(createOrderSchema),
    controller.createOrder
);

// PATCH /api/radiology-orders/:id/status
// Technicians can update examination status.
// Administrator-only correction endpoint.
// A reason is mandatory and the service records an audit event.
router.patch(
    "/:id/status/override",
    authorize("ADMIN"),
    validateBody(orderStatusOverrideSchema),
    controller.overrideOrderStatus
);

router.patch(
    "/:id/status",
    authorize("ADMIN", "TECHNICIAN"),
    validateBody(updateOrderStatusSchema),
    controller.updateOrderStatus
);

module.exports = router;