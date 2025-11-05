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
        return res.status(401).json({ message: "Usuário não autenticado" });
    }
    try {
        const order = await createOrderService(req.user.id, req.body.items);
        if (!order) {
            const error = new Error("Erro ao criar pedido.");
            (error as any).statusCode = 400;
            throw error;
        }
        
        res.status(order.status).json({ message: order.message, order: order.order ? order.order : null });
    } catch (error) {
        next(error);
    }
};

// Listar todos os pedidos do usuário (user)
export const getOrders = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Usuário não autenticado" });
    }
    try {
        const orders = await getOrdersService(req.user.id);
        if (!orders) {
            const error = new Error("Erro ao buscar pedidos.");
            (error as any).statusCode = 500;
            throw error;
        }

        res.status(orders.status).json({ message: orders.message, orders: orders.orders });
    } catch (error) {
        next(error);
    }
};

// Obter um pedido por ID (user)
export const getOrderById = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.params || !req.params.id) {
        return res.status(400).json({ message: "ID do pedido não fornecido" });
    }
    try {
        const order = await getOrderByIdService(req.params.id, req.user);
        if (!order) {
            const error = new Error("Erro ao buscar pedido.");
            (error as any).statusCode = 500;
            throw error;
        }

        res.status(order.status).json({ message: order.message, order: order.order ? order.order : null });
    } catch (error) {
        next(error);
    }
};

// Obter pedidos pelo status (user)
export const getOrdersByStatus = async (req: Request, res: Response) => {
    if (!req.params || !req.params.status) {
        return res.status(400).json({ message: "Status não fornecido" });
    }
    try {
        const orders = await getOrdersByStatusService(req.params.status, req.user);
        res.status(orders.status).json({ message: orders.message, orders: orders.orders ? orders.orders : null });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        res.status(500).json({ message: "Erro ao buscar pedidos", error: errorMessage });
    }
};

// Obter pedidos por status (admin - todos os pedidos)
export const getAllOrdersByStatus = async (req: Request, res: Response) => {
    if (!req.params || !req.params.status) {
        return res.status(400).json({ message: "Status não fornecido" });
    }
    try {
        const orders = await getAllOrdersByStatusService(req.params.status);
        res.status(orders.status).json({ message: orders.message, orders: orders.orders ? orders.orders : null });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        res.status(500).json({ message: "Erro ao buscar pedidos", error: errorMessage });
    }
};

// Obter pedidos por data (user)
export const getOrdersByDate = async (req: Request, res: Response) => {
    if (!req.params || !req.params.date) {
        return res.status(400).json({ message: "Data não fornecida" });
    }
    try {
        const orders = await getOrdersByDateService(req.params.date, req.user);
        res.status(orders.status).json({ message: orders.message, orders: orders.orders ? orders.orders : null });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        res.status(500).json({ message: "Erro ao buscar pedidos", error: errorMessage });
    }
};

// Obter pedidos por data (admin - todos os pedidos)
export const getAllOrdersByDate = async (req: Request, res: Response) => {
    if (!req.params || !req.params.date) {
        return res.status(400).json({ message: "Data não fornecida" })
    }
    try {
        const orders = await getAllOrdersByDateService(req.params.date);
        res.status(orders.status).json({ message: orders.message, orders: orders.orders ? orders.orders : null });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        res.status(500).json({ message: "Erro ao buscar pedidos", error: errorMessage });
    }
};

// Atualizar um pedido (admin)
export const updateOrder = async (req: Request, res: Response) => {
    if (!req.params || !req.body) {
        return res.status(400).json({ message: "Id ou alterações não fornecidas" })
    }
    try {
        const updatedOrder = await updateOrderService(req.params.id, req.body);
        res.status(updatedOrder.status).json({ message: updatedOrder.message, order: updatedOrder.order ? updatedOrder.order : null });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        res.status(400).json({ message: "Erro ao atualizar pedido", error: errorMessage });
    }
};

// Pagar um pedido (admin)
export const payOrder = async (req: Request, res: Response) => {
    if (!req.params || !req.params.id) {
        return res.status(400).json({ message: "Id não fornecido" });
    }
    try {
        const paidOrder = await payOrderService(req.params.id);
        res.status(paidOrder.status).json({ message: paidOrder.message, order: paidOrder.order ? paidOrder.order : null });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        res.status(400).json({ message: "Erro ao pagar pedido", error: errorMessage });
    }
};

// Enviar um pedido (admin)
export const shipOrder = async (req: Request, res: Response) => {
    if (!req.params || !req.params.id) {
        return res.status(400).json({ message: "Id não fornecido" });
    }
    try {
        const shippedOrder = await shipOrderService(req.params.id);
        res.status(shippedOrder.status).json({ message: shippedOrder.message, order: shippedOrder.order ? shippedOrder.order : null });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        res.status(400).json({ message: "Erro ao enviar pedido", error: errorMessage });
    }
};

// Cancelar um pedido (user)
export const cancelOrder = async (req: Request, res: Response) => {
    if (!req.params || !req.params.id) {
        return res.status(400).json({ message: "Id não fornecido" });
    }
    if (!req.user || !req.user.id || !req.user.role) {
        return res.status(401).json({ message: "Usuário não autenticado" });
    }
    try {
        const cancelledOrder = await cancelOrderService(req.params.id, { id: req.user.id, role: req.user.role });
        res.status(cancelledOrder.status).json({ message: cancelledOrder.message, order: cancelledOrder.order ? cancelledOrder.order : null });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        res.status(400).json({ message: "Erro ao cancelar pedido", error: errorMessage });
    }
};

// Deletar um pedido (admin)
export const deleteOrder = async (req: Request, res: Response) => {
    if (!req.params || !req.params.id) {
        return res.status(400).json({ message: "Id não fornecido" });
    }
    try {
        const deletedOrder = await deleteOrderService(req.params.id);
        res.status(deletedOrder.status).json({ message: deletedOrder.message });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        res.status(500).json({ message: "Erro ao deletar pedido", error: errorMessage });
    }
};
