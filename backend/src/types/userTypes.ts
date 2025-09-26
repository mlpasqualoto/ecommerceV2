import { Document } from "mongoose";

export interface IUser extends Document {
    userName: string;
    password: string;
    name: string;
    email: string;
    number: number;
    role?: "user" | "admin";
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IUserPayload {
    _id: string;
    userName: string;
    role: "user" | "admin";
}

export interface UserServiceResult {
    status: number;
    message: string;
    user?: any;
    users?: any[];
}

export interface UserLoginServiceResult extends UserServiceResult {
    token?: string;
}

export interface CreateUserDTO {
    userName: string;
    password: string;
    name: string;
    email: string;
    number: string;
}

export interface CreateUserByAdminDTO extends CreateUserDTO {
    role: "user" | "admin";
}

export interface LoginUserDTO {
    userName: string;
    password: string;
}

export interface UpdateUserDTO {
    userName: string;
    name: string;
    email: string;
    number: string;
}

export interface UpdatePasswordDTO {
    currentPassword: string;
    newPassword: string;
}
