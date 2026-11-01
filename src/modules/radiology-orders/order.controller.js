const orderService = require("./order.service");

// POST /api/radiology-orders
async function createOrder(req, res, next) {
    try {
        const order = await orderService.createOrder(
            req.validatedBody,
            req.user.id
        );

        return res.status(201).json({
            success: true,
            data: order,
        });
    } catch (error) {
        next(error);
    }
}

// GET /api/radiology-orders
async function listOrders(req, res, next) {
    try {
        const result = await orderService.listOrders(
            req.validatedQuery
        );

        return res.status(200).json({
            success: true,
            data: result.orders,
            pagination: result.pagination,
        });
    } catch (error) {
        next(error);
    }
}

// GET /api/radiology-orders/:id
async function getOrder(req, res, next) {
    try {
        const order = await orderService.getOrderById(
            req.params.id
        );

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Radiology order not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: order,
        });
    } catch (error) {
        next(error);
    }
}

// PATCH /api/radiology-orders/:id/status
async function updateOrderStatus(req, res, next) {
    try {
        const order = await orderService.changeOrderStatus(
            req.params.id,
            req.validatedBody.status,
            req.user.id
        );

        return res.status(200).json({
            success: true,
            data: order,
        });
    } catch (error) {
        next(error);
    }
}

async function overrideOrderStatus(req, res, next) {
    try {
        const { status, reason } = req.validatedBody;

        const order = await orderService.overrideOrderStatus(
            req.params.id,
            status,
            reason,
            req.user.id
        );

        return res.status(200).json({
            success: true,
            message: "Radiology order status overridden successfully",
            data: order,
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createOrder,
    listOrders,
    getOrder,
    updateOrderStatus,
    overrideOrderStatus,
};