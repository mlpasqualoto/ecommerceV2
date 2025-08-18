import User from "../models/User.js";
import { verifyToken } from "../config/auth.js";

const authenticateToken = async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(403).json({ message: "Token não fornecido" });
  }

  try {
    const decoded = verifyToken(token);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    req.user = {
      id: user._id,
      userName: user.userName,
      role: user.role
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: "Token inválido" });
  }
};

export default authenticateToken;
