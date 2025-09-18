import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

export const JWT_SECRET = process.env.JWT_SECRET || "defaultSecret";
export const JWT_EXPIRES = "1h";
const SALT_ROUNDS = 10;

// Gera token
export const generateToken = (user: { _id: string; userName: string }) => {
    return jwt.sign(
        { id: user._id, userName: user.userName },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES }
    );
};

// Verifica token
export const verifyToken = (token: string) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return null;
    }
};

// Hash de senha
export const hashPassword = async (password: string) => {
    return await bcrypt.hash(password, SALT_ROUNDS);
};

// Comparar senha
export const comparePassword = async (password: string, hash: string) => {
    return await bcrypt.compare(password, hash);
};
