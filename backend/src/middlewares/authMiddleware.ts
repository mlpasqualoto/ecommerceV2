import User from "../models/User";
import { verifyToken } from "../config/auth";
import express from "express";

interface IUserPayload {
  id: string;
  userName: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: IUserPayload;
    }
  }
}

const authenticateToken = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ message: "Token não fornecido" });
  }

  try {
    const decoded = verifyToken(token);
    if (!decoded || typeof decoded === "string" || !('id' in decoded)) {
      return res.status(401).json({ message: "Token inválido" });
    }

    const user = await User.findById((decoded as { id: string }).id);
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    req.user = {
      id: user._id as string,
      userName: user.userName as string,
      role: user.role as "user" | "admin"
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: "Token inválido" });
  }
};

export default authenticateToken;
