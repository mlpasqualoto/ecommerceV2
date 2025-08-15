import express from "express";
import {
  getUsers,
  getUserProfile,
  getCurrentUser,
  createUser,
  loginUser,
  updateUser,
  updatePassword,
  deleteUser
} from "../controllers/userController.js"
import authenticateToken from "../middlewares/authMiddleware.js";
import authorizeRole from "../middlewares/authRoleMiddleware.js";

const router = express.Router();

// Rota para obter todos os usuários
router.get("/", authenticateToken, authorizeRole("admin"), getUsers);

// Rota para obter o perfil do usuário autenticado
router.get("/profile", authenticateToken, getUserProfile);

// Rota para pegar os dados do usuário logado
router.get("/me", authenticateToken, getCurrentUser);

// Rota para registro de um novo usuário
router.post("/register", createUser);

// Rota para login de usuário
router.post("/login", loginUser);

// Rota para atualização de usuário
router.put("/update", authenticateToken, updateUser);

// Rota para atualização de senha
router.put("/update-password", authenticateToken, updatePassword);

// Rota para deletar usuário
router.delete("/:id/delete", authenticateToken, authorizeRole("admin"), deleteUser);

export default router;
