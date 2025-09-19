import Order from "../models/Order";
import User from "../models/User";
import Product from "../models/Product";
import { isValidDate } from "../utils/utils";
import { Request, Response } from "express";

declare global {
    namespace Express {
        interface Request {
            files?: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[];
        }
    }
}

// Criar um novo pedido (user)
export const createOrder = async (req: Request, res: Response) => {
    try {
        // Pega o ID do usuário autenticado (via token)
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Usuário não autenticado" });
        }
        const userId = req.user.id;

        // Busca o usuário no banco para pegar o userName
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "Usuário não encontrado" });
        }

        // Monta os items preenchendo name e price do produto
        let filesArray: Express.Multer.File[] = [];
        if (Array.isArray(req.files)) {
            filesArray = req.files;
        } else if (req.files && typeof req.files === 'object') {
            filesArray = Object.values(req.files).flat();
        }
        const items = await Promise.all(
            req.body.items.map(async (item: { productId: string; quantity: number; }) => {
                const product: any = await Product.findById(item.productId);
                if (!product) {
                    throw new Error(`Produto com ID ${item.productId} não encontrado`);
                }

                const originalPrice = product.price;

                // Aplica o desconto, se houver
                const price = product.discount > 0
                    ? product.price - (product.price * product.discount / 100)
                    : product.price;

                return {
                    productId: product._id,
                    name: product.name,
                    quantity: item.quantity,
                    originalPrice,
                    discount: product.discount,
                    price,
                    imageUrl: product.images && product.images.length > 0
                        ? product.images[0].url
                        : ""
                };
            })
        );

        // Calcula o total
        const totalAmount = items.reduce((acc, item) => acc + (item.price * item.quantity), 0).toFixed(2);
        const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);

        // Cria e salva o pedido
        const order = new Order({
            userId: user._id,
            userName: user.userName, // salva no banco também
            name: user.name,
            items,
            totalAmount,
            totalQuantity,
            status: "pending"
        });

        const savedOrder = await order.save();

        res.status(201).json({
            message: "Pedido criado com sucesso",
            order: savedOrder
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        res.status(400).json({ message: "Erro ao criar pedido", error: errorMessage });
    }
};

// Listar todos os pedidos do usuário (user)
export const getOrders = async (req: Request, res: Response) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Usuário não autenticado" });
        }
        const orders = await Order.find({ userId: req.user.id });

        res.json({ message: "Pedidos encontrados com sucesso", orders: orders });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        res.status(500).json({ message: "Erro ao buscar pedidos", error: errorMessage });
    }
};

// Obter um pedido por ID (admin ou user)
export const getOrderById = async (req: Request, res: Response) => {
    try {
        if (!req.params || !req.params.id) {
            return res.status(400).json({ message: "ID do pedido não fornecido" });
        }

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: "Pedido não encontrado" });
        }

        // Se não for admin e o pedido não for do usuário logado, bloqueia
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Usuário não autenticado" });
        }

        if (req.user.role !== "admin" && order.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Acesso negado" });
        }

        res.json({ message: "Pedido encontrado com sucesso", order: order });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        res.status(500).json({ message: "Erro ao buscar pedido", error: errorMessage });
    }
};

// Obter pedidos pelo status (user)
export const getOrdersByStatus = async (req: Request, res: Response) => {
    try {
        if (!req.params || !req.params.status) {
            return res.status(400).json({ message: "Status não fornecido" });
        }
        const { status } = req.params;

        const allowedStatuses = ["pending", "paid", "shipped", "delivered", "cancelled"];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ message: "Status inválido" });
        }

        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Usuário não autenticado" });
        }
        const orders = await Order.find({ status, userId: req.user.id });

        if (orders.length === 0) {
            return res.status(404).json({ message: "Nenhum pedido encontrado com o status especificado" });
        }

        res.json({ message: "Pedidos encontrados com sucesso", orders: orders });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        res.status(500).json({ message: "Erro ao buscar pedidos", error: errorMessage });
    }
};

// Obter pedidos por status (somente admin - todos os pedidos)
export const getAllOrdersByStatus = async (req: Request, res: Response) => {
    try {
        if (!req.params || !req.params.status) {
            return res.status(400).json({ message: "Status não fornecido" });
        }
        const { status } = req.params;

        const allowedStatuses = ["pending", "paid", "shipped", "delivered", "cancelled"];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ message: "Status inválido" });
        }

        // Busca todos os pedidos com o status informado
        const orders = await Order.find({ status });
        if (orders.length === 0) {
            return res.status(404).json({ message: "Nenhum pedido encontrado com o status especificado" });
        }

        res.json({ message: "Pedidos encontrados com sucesso", orders });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        res.status(500).json({ message: "Erro ao buscar pedidos", error: errorMessage });
    }
};

// Obter pedidos por data (user)
export const getOrdersByDate = async (req: Request, res: Response) => {
    try {
        if (!req.params || !req.params.date) {
            return res.status(400).json({ message: "Data não fornecida" });
        }
        const { date } = req.params;

        // Valida a data
        if (!isValidDate(date)) {
            return res.status(400).json({ message: "Data inválida" });
        }

        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Usuário não autenticado" })
        }
        const orders = await Order.find({ userId: req.user.id, createdAt: { $gte: new Date(date), $lt: new Date(date + "T23:59:59") } });

        if (orders.length === 0) {
            return res.status(404).json({ message: "Nenhum pedido encontrado com a data especificada" });
        }

        res.json({ message: "Pedidos encontrados com sucesso", orders: orders });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        res.status(500).json({ message: "Erro ao buscar pedidos", error: errorMessage });
    }
};

// Obter pedidos por data (somente admin - todos os pedidos)
export const getAllOrdersByDate = async (req: Request, res: Response) => {
    try {
        if (!req.params || !req.params.date) {
            return res.status(400).json({ message: "Data não fornecida" })
        }
        const { date } = req.params;

        // Valida a data
        if (!isValidDate(date)) {
            return res.status(400).json({ message: "Data inválida" });
        }

        // Busca todos os pedidos com a data informada
        const orders = await Order.find({ createdAt: { $gte: new Date(date), $lt: new Date(date + "T23:59:59") } });
        if (orders.length === 0) {
            return res.status(404).json({ message: "Nenhum pedido encontrado com a data especificada" });
        }

        res.json({ message: "Pedidos encontrados com sucesso", orders: orders });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        res.status(500).json({ message: "Erro ao buscar pedidos", error: errorMessage });
    }
};

// Atualizar um pedido (somente admin)
export const updateOrder = async (req: Request, res: Response) => {
    try {
        if (!req.params || !req.body) {
            return res.status(400).json({ message: "Id ou alterações não fornecidas" })
        }
        const updatedOrder = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if (!updatedOrder) {
            return res.status(404).json({ message: "Pedido não encontrado" });
        }

        res.json({ message: "Pedido atualizado com sucesso", order: updatedOrder });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        res.status(400).json({ message: "Erro ao atualizar pedido", error: errorMessage });
    }
};

// Pagar um pedido (somente admin)
export const payOrder = async (req: Request, res: Response) => {
    try {
        if (!req.params || !req.params.id) {
            return res.status(400).json({ message: "Id não fornecido" });
        }
        const paidOrder = await Order.findByIdAndUpdate(req.params.id, { status: "paid" }, { new: true });

        if (!paidOrder) {
            return res.status(404).json({ message: "Pedido não encontrado" });
        }

        res.json({ message: "Pedido pago com sucesso", order: paidOrder });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        res.status(400).json({ message: "Erro ao pagar pedido", error: errorMessage });
    }
};

// Enviar um pedido (somente admin)
export const shipOrder = async (req: Request, res: Response) => {
    try {
        if (!req.params || !req.params.id) {
            return res.status(400).json({ message: "Id não fornecido" });
        }
        const shippedOrder = await Order.findByIdAndUpdate(req.params.id, { status: "shipped" }, { new: true });

        if (!shippedOrder) {
            return res.status(404).json({ message: "Pedido não encontrado" });
        }

        res.json({ message: "Pedido enviado com sucesso", order: shippedOrder });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        res.status(400).json({ message: "Erro ao enviar pedido", error: errorMessage });
    }
};

// Cancelar um pedido (admin ou user)
export const cancelOrder = async (req: Request, res: Response) => {
    try {
        if (!req.params || !req.params.id) {
            return res.status(400).json({ message: "Id não fornecido" });
        }
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: "Pedido não encontrado" });
        }

        if (!req.user || !req.user.role || !req.user.id) {
            return res.status(401).json({ message: "Usuário não autenticado" });
        }
        if (req.user.role !== "admin" && order.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Acesso negado" });
        }

        order.status = "cancelled";
        await order.save();

        res.json({ message: "Pedido cancelado com sucesso", order: order });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        res.status(400).json({ message: "Erro ao cancelar pedido", error: errorMessage });
    }
};

// Deletar um pedido (somente admin)
export const deleteOrder = async (req: Request, res: Response) => {
    try {
        if (!req.params || !req.params.id) {
            return res.status(400).json({ message: "Id não fornecido" });
        }
        const deletedOrder = await Order.findByIdAndDelete(req.params.id);

        if (!deletedOrder) {
            return res.status(404).json({ message: "Pedido não encontrado" });
        }

        res.json({ message: "Pedido deletado com sucesso" });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        res.status(500).json({ message: "Erro ao deletar pedido", error: errorMessage });
    }
};
