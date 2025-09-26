import { Types, Document } from "mongoose"

export interface IOrderItem {
    productId: Types.ObjectId;
    name: string;
    quantity: number;
    originalPrice: number;
    discount: number;
    price: number;
    imageUrl: string;
}

export interface IOrder extends Document {
    userId: Types.ObjectId;
    userName: string;
    name: string;
    items: IOrderItem[];
    totalAmount: number;
    totalQuantity: number;
    status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
    createdAt?: Date;
    updatedAt?: Date;
}

export interface OrderServiceResult {
    status: number;
    message: string;
    order?: any;
    orders?: any[];
}

export interface UpdateOrderDTO {
    productId: string;
    quantity: number;
    status: string;
    totalAmount: number;
}

export interface CreateOrderDTO {
    productId: string;
    quantity: number;
}
