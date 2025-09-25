import mongoose, { Schema } from "mongoose";
import { IUser } from "../types/userTypes";

const usuarioSchema = new Schema<IUser>({
    userName: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    number: {
        type: Number,
        required: true,
        trim: true
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    }
}, {
    versionKey: false, // remove o campo "__v" do documento
    timestamps: true // cria automaticamente createdAt e updatedAt
});

export default mongoose.model<IUser>("User", usuarioSchema);
