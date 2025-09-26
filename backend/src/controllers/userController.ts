import {
  getUsersService,
  getUserProfileService,
  getUserByIdService,
  getUserByRoleService,
  createUserService,
  createUserByAdminService,
  loginUserService,
  updateUserService,
  updatePasswordService,
  deleteUserService
} from "../services/userService";
import { Request, Response } from "express";

// Obter todos os usuários (admin)
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await getUsersService();

    res.status(users.status).json({ message: users.message, users: users.users });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ message: "Erro ao buscar usuários", error: errorMessage });
  }
};

// Obter perfil do usuário (user)
export const getUserProfile = async (req: Request, res: Response) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: "Não autenticado" });
  }
  try {
    const userProfile = await getUserProfileService(req.user.id);
    res.status(userProfile.status).json({ message: userProfile.message, user: userProfile.user ? userProfile.user : null });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ message: "Erro ao buscar perfil", error: errorMessage });
  }
};

// Obter usuário por ID (admin)
export const getUserById = async (req: Request, res: Response) => {
  if (!req.params || !req.params.id) {
    return res.status(404).json({ message: "ID do usuário não fornecido" });
  }
  try {
    const userResult = await getUserByIdService(req.params.id);
    res.status(userResult.status).json({ message: userResult.message, user: userResult.user ? userResult.user : null });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ message: "Erro ao buscar usuário", error: errorMessage });
  }
};

// Obter usuários por função (admin)
export const getUsersByRole = async (req: Request, res: Response) => {
  if (!req.params || !req.params.role) {
    return res.status(404).json({ message: "Função (role) não fornecida" });
  }
  try {
    const usersResult = await getUserByRoleService(req.params.role)
    res.status(usersResult.status).json({ message: usersResult.message, users: usersResult });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ message: "Erro ao buscar usuários", error: errorMessage });
  }
};

// Rota para obter informações do usuário logado (user)
// Lógica no controller
export const getCurrentUser = async (req: Request, res: Response) => {
  if (!req.user || !req.user.id || !req.user.userName || !req.user.role) {
    return res.status(401).json({ message: "Não autenticado" });
  }
  try {
    res.json({ id: req.user.id, userName: req.user.userName, role: req.user.role });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ message: "Erro ao obter usuário", error: errorMessage });
  }
};

// Criação de usuário (public)
export const createUser = async (req: Request, res: Response) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ message: "Dados do usuário não fornecidos" });
  }
  try {
    const savedNewUser = await createUserService(req.body)
    res.status(savedNewUser.status).json({ message: savedNewUser.message, user: savedNewUser.user ? savedNewUser.user : null })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(400).json({ message: "Erro ao criar usuário", error: errorMessage });
  }
};

// Criação de usuário protegida (admin)
export const createUserByAdmin = async (req: Request, res: Response) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ message: "Dados do usuário não fornecidos" });
  }

  const { role } = req.body;
  // 🔒 só admins podem criar admins
  if (!req.user || !req.user.role) {
    return res.status(401).json({ message: "Não autenticado" });
  }
  if (role === "admin" && req.user.role !== "admin") {
    return res.status(403).json({ message: "Somente administradores podem criar outros administradores" });
  }
  try {
    const savedNewUser = await createUserByAdminService(req.body);
    res.status(savedNewUser.status).json({ message: savedNewUser.message, user: savedNewUser.user ? savedNewUser.user : null });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(400).json({ message: "Erro ao criar usuário", error: errorMessage });
  }
};

// Login do usuário (public)
export const loginUser = async (req: Request, res: Response) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ message: "Dados de login não fornecidos" });
  }
  try {
    const loginResult = await loginUserService(req.body)

    if (loginResult.status !== 200 || !loginResult.token) {
      return res.status(loginResult.status).json({ message: loginResult.message })
    }

    // Envia o token como cookie HTTP-only
    res.cookie("token", loginResult.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600000, // 1 hora
    });

    res.status(loginResult.status).json({ message: loginResult.message, user: loginResult.user, token: loginResult.token });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ message: "Erro ao fazer login", error: errorMessage });
  }
};

// Logout do usuário (public)
// Lógica no controller
export const logoutUser = async (req: Request, res: Response) => {
  try {
    res.clearCookie("token");
    res.json({ message: "Logout realizado com sucesso" });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ message: "Erro ao fazer logout", error: errorMessage });
  }
};

// Atualização de usuário (user)
export const updateUser = async (req: Request, res: Response) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ message: "Dados para atualização não fornecidos" });
  }
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: "Não autenticado" });
  }
  try {
    const updatedUser = await updateUserService(req.body, req.user.id)
    res.status(updatedUser.status).json({ message: updatedUser.message, user: updatedUser.user ? updatedUser.user : null });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(400).json({ message: "Erro ao atualizar usuário", error: errorMessage });
  }
};

// Atualização de senha (user)
export const updatePassword = async (req: Request, res: Response) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ message: "Dados para atualização não fornecidos" });
  }
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: "Não autenticado" });
  }
  try {
    const updatedPassword = await updatePasswordService(req.body, req.user.id)
    res.status(updatedPassword.status).json({ message: updatedPassword.message });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(400).json({ message: "Erro ao alterar senha", error: errorMessage });
  }
};

// Deletar usuário (admin)
export const deleteUser = async (req: Request, res: Response) => {
  if (!req.params || !req.params.id) {
    return res.status(400).json({ message: "Dado não fornecido" })
  }
  try {
    const deletedUser = await deleteUserService(req.params.id);
    res.status(deletedUser.status).json({ message: deletedUser.message });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ message: "Erro ao deletar usuário", error: errorMessage });
  }
};
