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
  adminQueryLimiter,
  sensitiveActionLimiter,
  publicActionLimiter,
} from "../middlewares/rateLimitMiddleware"

const router: express.Router = express.Router();

// Rota para obter todos os usuários (admin)
router.get("/", authenticateToken, authorizeRole("admin"), adminQueryLimiter, getUsers);

// Rota para obter o perfil do usuário autenticado (user)
router.get("/profile", authenticateToken, getUserProfile);

// Rota para pegar os dados do usuário logado (user)
router.get("/me", authenticateToken, getCurrentUser);

// Rota protegida para obter um usuário por ID (admin)
router.get("/:id", authenticateToken, authorizeRole("admin"), adminQueryLimiter, getUserById);

// Rota protegida para obter usuários por role (admin)
router.get("/role/:role", authenticateToken, authorizeRole("admin"), sensitiveActionLimiter, getUsersByRole);

// Rota pública para registro de um novo usuário (public)
router.post("/register", publicActionLimiter, createUser);

// Rota protegida para criação de usuário por admin (admins)
router.post("/admin/register", authenticateToken, authorizeRole("admin"), sensitiveActionLimiter, createUserByAdmin);

// Rota para login de usuário (public)
router.post("/login", publicActionLimiter, loginUser);

// Rota para logout de usuário (public)
router.post("/logout", logoutUser);

// Rota para atualização de usuário (user)
router.put("/update", authenticateToken, updateUser);

// Rota para atualização de senha (user)
router.put("/update-password", authenticateToken, sensitiveActionLimiter, updatePassword);

// Rota para deletar usuário (admin)
router.delete("/:id/delete", authenticateToken, authorizeRole("admin"), publicActionLimiter, deleteUser);

export default router;
