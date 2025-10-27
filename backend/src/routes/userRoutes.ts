import express from "express";
import {
  getUsers,
  getUserProfile,
  getUserById,
  getUsersByRole,
  getCurrentUser,
  createUser,
  createUserByAdmin,
  loginUser,
  logoutUser,
  updateUser,
  updatePassword,
  deleteUser,
} from "../controllers/userController";
import authenticateToken from "../middlewares/authMiddleware";
import { authorizeRole } from "../middlewares/authRoleMiddleware";
import { 
  loginLimiter,
} from "../middlewares/rateLimitMiddleware"

const router: express.Router = express.Router();

// Rota para obter todos os usuários (admin)
router.get("/", authenticateToken, authorizeRole("admin"), getUsers);

// Rota para obter o perfil do usuário autenticado (user)
router.get("/profile", authenticateToken, getUserProfile);

// Rota para pegar os dados do usuário logado (user)
router.get("/me", authenticateToken, getCurrentUser);

// Rota protegida para obter um usuário por ID (admin)
router.get("/:id", authenticateToken, authorizeRole("admin"), getUserById);

// Rota protegida para obter usuários por role (admin)
router.get("/role/:role", authenticateToken, authorizeRole("admin"), getUsersByRole);

// Rota pública para registro de um novo usuário (public)
router.post("/register", createUser);

// Rota protegida para criação de usuário por admin (admins)
router.post("/admin/register", authenticateToken, authorizeRole("admin"), createUserByAdmin);

// Rota para login de usuário (public)
router.post("/login", loginLimiter, loginUser);

// Rota para logout de usuário (public)
router.post("/logout", logoutUser);

// Rota para atualização de usuário (user)
router.put("/update", authenticateToken, updateUser);

// Rota para atualização de senha (user)
router.put("/update-password", authenticateToken, updatePassword);

// Rota para deletar usuário (admin)
router.delete("/:id/delete", authenticateToken, authorizeRole("admin"), deleteUser);

export default router;
