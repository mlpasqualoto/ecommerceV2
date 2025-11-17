import { Document } from "mongoose"

export interface IProductImage {
    public_id: string;
    url: string;
    width: number;
    height: number;
    format: string;
    bytes: number;
}

export interface IProduct extends Document {
    name: string;
    price: number;
    images?: IProductImage[];
    description?: string;
    category: string;
    stock?: number;
    status: "active" | "inactive" | "out_of_stock" | "archived" | "draft";
    discount: number;
    externalId?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ProductServiceResult {
    status: number;
    message: string;
    product?: any;
    products?: any[];
}

export interface UpdateProductDTO {
    name?: string;
    price?: number;
    description?: string;
    category?: string;
    stock?: number;
    status?: "active" | "inactive" | "out_of_stock" | "archived" | "draft";
    discount?: number;
    existingImages?: IProductImage[];
}

export interface CreateProductDTO {
    name: string;
    price: number;
    description?: string;
    category: string;
    stock?: number;
    status: string;
    discount?: number;
    images?: IProductImage[];
}
