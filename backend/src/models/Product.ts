import mongoose, { Schema } from "mongoose";
import { IProduct, IProductImage } from "../types/productTypes";

const imageSchema = new Schema<IProductImage>({
    public_id: String,
    url: String,
    width: Number,
    height: Number,
    format: String,
    bytes: Number,
}, { _id: false });


const productSchema = new Schema<IProduct>({
    name: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    images: [imageSchema],
    description: {
        type: String,
        default: ""
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    stock: {
        type: Number,
        default: 0,
        min: 0
    },
    status: {
        type: String,
        enum: ["active", "inactive", "out_of_stock", "archived", "draft"],
        required: true,
        default: "active",
    },
    discount: {
        type: Number,
        default: 0,
        min: 0
    },
}, {
    versionKey: false,
    timestamps: true,
});

export default mongoose.model<IProduct>("Product", productSchema);
