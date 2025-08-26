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
} from "../controllers/userController.js";
import authenticateToken from "../middlewares/authMiddleware.js";
import { authorizeRole } from "../middlewares/authRoleMiddleware.js";

const router = express.Router();

// Rota para obter todos os usuários
router.get("/", authenticateToken, authorizeRole("admin"), getUsers);

// Rota para obter o perfil do usuário autenticado
router.get("/profile", authenticateToken, getUserProfile);

// Rota para pegar os dados do usuário logado
router.get("/me", authenticateToken, getCurrentUser);

// Rota protegida para obter um usuário por ID (apenas admin)
router.get("/:id", authenticateToken, authorizeRole("admin"), getUserById);

// Rota protegida para obter usuários por role (apenas admin)
router.get("/role/:role", authenticateToken, authorizeRole("admin"), getUsersByRole);

// Rota pública para registro de um novo usuário
router.post("/register", createUser);

// Rota protegida para criação de usuário por admin
router.post(
  "/admin/register",
  authenticateToken,
  authorizeRole("admin"),
  createUserByAdmin
);

// Rota para login de usuário
router.post("/login", loginUser);

// Rota para logout de usuário
router.post("/logout", logoutUser);

// Rota para atualização de usuário
router.put("/update", authenticateToken, updateUser);

// Rota para atualização de senha
router.put("/update-password", authenticateToken, updatePassword);

// Rota para deletar usuário
router.delete(
  "/:id/delete",
  authenticateToken,
  authorizeRole("admin"),
  deleteUser
);

export default router;
