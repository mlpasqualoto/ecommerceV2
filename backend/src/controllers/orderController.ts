import {
    createOrderService,
    getOrdersService,
    getOrderByIdService,
    getOrdersByStatusService,
    getAllOrdersByStatusService,
    getOrdersByDateService,
    getAllOrdersByDateService,
    updateOrderService,
    payOrderService,
    shipOrderService,
    cancelOrderService,
    deleteOrderService
} from "../services/orderService";
import { NextFunction, Request, Response } from "express";

// Criar um novo pedido (user)
export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.id) {
        const error = new Error("Usuário não autenticado.");
        (error as any).statusCode = 401;
        return next(error);
    }
    try {
        const order = await createOrderService(req.user.id, req.body.items);
        if (!order) {
            const error = new Error("Erro ao criar pedido.");
            (error as any).statusCode = 400;
            return next(error);
        }
        
        return res.status(order.status ?? 200).json({ message: order.message, order: order.order ?? null });
    } catch (error) {
        return next(error);
    }
};

// Listar todos os pedidos do usuário (user)
export const getOrders = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.id) {
        const error = new Error("Usuário não autenticado.");
        (error as any).statusCode = 401;
        return next(error);
    }
    try {
        const orders = await getOrdersService(req.user.id);
        if (!orders) {
            const error = new Error("Erro ao buscar pedidos.");
            (error as any).statusCode = 500;
            return next(error);
        }

        return res.status(orders.status ?? 200).json({ message: orders.message, orders: orders.orders ?? null });
    } catch (error) {
        return next(error);
    }
};

// Obter um pedido por ID (user)
export const getOrderById = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.params.id) {
        const error = new Error("ID do pedido não fornecido.");
        (error as any).statusCode = 400;
        return next(error);
    }
    try {
        const order = await getOrderByIdService(req.params.id, req.user);
        if (!order) {
            const error = new Error("Erro ao buscar pedido.");
            (error as any).statusCode = 500;
            return next(error);
        }

        return res.status(order.status ?? 200).json({ message: order.message, order: order.order ?? null });
    } catch (error) {
        return next(error);
    }
};

// Obter pedidos pelo status (user)
export const getOrdersByStatus = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.params.status) {
        const error = new Error("Status não fornecido.");
        (error as any).statusCode = 400;
        return next(error)
    }
    try {
        const orders = await getOrdersByStatusService(req.params.status, req.user);
        if (!orders) {
            const error = new Error("Erro ao buscar pedidos.");
            (error as any).statusCode = 500;
            return next(error);
        }

        return res.status(orders.status ?? 200).json({ message: orders.message, orders: orders.orders ?? null });
    } catch (error) {
        return next(error);
    }
};

// Obter pedidos por status (admin - todos os pedidos)
export const getAllOrdersByStatus = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.params.status) {
        const error = new Error("Status não fornecido.");
        (error as any).statusCode = 400;
        return next(error);
    }
    try {
        const orders = await getAllOrdersByStatusService(req.params.status);
        if (!orders) {
            const error = new Error("Erro ao buscar pedidos.");
            (error as any).statusCode = 500;
            return next(error);
        }

        return res.status(orders.status ?? 200).json({ message: orders.message, orders: orders.orders ?? null });
    } catch (error) {
        return next(error);
    }
};

// Obter pedidos por data (user)
export const getOrdersByDate = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.params.date) {
        const error = new Error("Data não fornecida.");
        (error as any).statusCode = 400;
        return next(error);
    }
    try {
        const orders = await getOrdersByDateService(req.params.date, req.user);
        if (!orders) {
            const error = new Error("Erro ao buscar pedidos.");
            (error as any).statusCode = 500;
            return next(error);
        }

        return res.status(orders.status ?? 200).json({ message: orders.message, orders: orders.orders ?? null });
    } catch (error) {
        return next(error);
    }
};

// Obter pedidos por data (admin - todos os pedidos)
export const getAllOrdersByDate = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.params.date) {
        const error = new Error("Data não fornecida.");
        (error as any).statusCode = 400;
        return next(error);
    }
    try {
        const orders = await getAllOrdersByDateService(req.params.date);
        if (!orders) {
            const error = new Error("Erro ao buscar pedidos.");
            (error as any).statusCode = 500;
            return next(error);
        }

        return res.status(orders.status ?? 200).json({ message: orders.message, orders: orders.orders ?? null });
    } catch (error) {
        return next(error);
    }
};

// Atualizar um pedido (admin)
export const updateOrder = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.body) {
        const error = new Error("Id ou alterações não fornecidas.");
        (error as any).statusCode = 400;
        return next(error);
    }
    try {
        const updatedOrder = await updateOrderService(req.params.id, req.body);
        if (!updatedOrder) {
            const error = new Error("Erro ao atualizar pedido.");
            (error as any).statusCode = 400;
            return next(error);
        }

        return res.status(updatedOrder.status ?? 200).json({ message: updatedOrder.message, order: updatedOrder.order ?? null });
    } catch (error) {
        return next(error);
    }
};

// Pagar um pedido (admin)
export const payOrder = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.params.id) {
        const error = new Error("Id não fornecido.");
        (error as any).statusCode = 400;
        return next(error);
    }
    try {
        const paidOrder = await payOrderService(req.params.id);
        if (!paidOrder) {
            const error = new Error("Erro ao pagar pedido.");
            (error as any).statusCode = 400;
            return next(error);
        }

        return res.status(paidOrder.status ?? 200).json({ message: paidOrder.message, order: paidOrder.order ?? null });
    } catch (error) {
        return next(error);
    }
};

// Enviar um pedido (admin)
export const shipOrder = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.params.id) {
        const error = new Error("Id não fornecido.");
        (error as any).statusCode = 400;
        return next(error);
    }
    try {
        const shippedOrder = await shipOrderService(req.params.id);
        if (!shippedOrder) {
            const error = new Error("Erro ao enviar pedido.");
            (error as any).statusCode = 400;
            return next(error);
        }

        return res.status(shippedOrder.status ?? 200).json({ message: shippedOrder.message, order: shippedOrder.order ?? null });
    } catch (error) {
        return next(error);
    }
};

// Cancelar um pedido (user)
export const cancelOrder = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.params.id) {
        const error = new Error("Id não fornecido.");
        (error as any).statusCode = 400;
        return next(error);
    }
    if (!req.user || !req.user.id || !req.user.role) {
        const error = new Error("Usuário não autenticado.");
        (error as any).statusCode = 401;
        return next(error);
    }
    try {
        const cancelledOrder = await cancelOrderService(req.params.id, { id: req.user.id, role: req.user.role });
        if (!cancelledOrder) {
            const error = new Error("Erro ao cancelar pedido.");
            (error as any).statusCode = 400;
            return next(error);
        }

        return res.status(cancelledOrder.status ?? 200).json({ message: cancelledOrder.message, order: cancelledOrder.order ?? null });
    } catch (error) {
        return next(error);
    }
};

// Deletar um pedido (admin)
export const deleteOrder = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.params.id) {
        const error = new Error("Id não fornecido.");
        (error as any).statusCode = 400;
        return next(error);
    }
    try {
        const deletedOrder = await deleteOrderService(req.params.id);
        if (!deletedOrder) {
            const error = new Error("Erro ao deletar pedido.");
            (error as any).statusCode = 500;
            return next(error);
        }

        return res.status(deletedOrder.status ?? 200).json({ message: deletedOrder.message });
    } catch (error) {
        return next(error);
    }
};
