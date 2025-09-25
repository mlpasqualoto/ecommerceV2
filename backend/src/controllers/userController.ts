import User from "../models/User";
import {
  getUsersService,
  getUserProfileService,
  getUserByIdService,
  getUserByRoleService,
  createUserService,
  createUserByAdminService,
} from "../services/userService";
import {
  generateToken,
  hashPassword,
  comparePassword
} from "../config/auth";
import {
  IUserPayload
} from "../types/userTypes"
import { Request, Response } from "express";

// Obter todos os usuários
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await getUsersService();

    res.status(users.status).json({ message: users.message, users: users.users });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ message: "Erro ao buscar usuários", error: errorMessage });
  }
};

// Obter perfil do usuário
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

// Obter usuário por ID
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

// Obter usuários por função (role)
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

// Rota para obter informações do usuário logado
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

// Criação de usuário público (sempre role: "user")
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

// Criação de usuário protegida (somente admin pode criar outro admin)
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
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    res.status(400).json({ message: "Erro ao criar usuário", error: errorMessage });
  }
};

// Login do usuário
export const loginUser = async (req: Request, res: Response) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "Dados de login não fornecidos" });
    }
    const { userName, password } = req.body;

    // Busca usuário pelo userName
    const user = await User.findOne({ userName });
    if (!user || !(await comparePassword(password, user.password))) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    // Gera token
    const token = generateToken(user as IUserPayload);

    // Envia o token como cookie HTTP-only
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600000, // 1 hora
    });

    res.json({ message: "Login realizado com sucesso", token: token });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    res.status(500).json({ message: "Erro ao fazer login", error: errorMessage });
  }
};

// Logout do usuário
export const logoutUser = async (req: Request, res: Response) => {
  try {
    res.clearCookie("token");
    res.json({ message: "Logout realizado com sucesso" });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    res.status(500).json({ message: "Erro ao fazer logout", error: errorMessage });
  }
};

// Atualização de usuário
export const updateUser = async (req: Request, res: Response) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "Dados para atualização não fornecidos" });
    }
    const { userName, name, email, number } = req.body;

    // Verifica se já existe username ou email em outro usuário
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    const existingUser = await User.findOne({
      $or: [{ userName }, { email }],
      _id: { $ne: req.user.id }, // ignora o próprio usuário
    });

    if (existingUser) {
      return res.status(400).json({ message: "Usuário ou e-mail já cadastrado" });
    }

    // Atualiza somente os campos enviados (evita sobrescrever com undefined)
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { userName, name, email, number },
      { new: true, select: "-password" }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    res.json({ message: "Dados atualizados com sucesso", user: updatedUser });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    res.status(400).json({ message: "Erro ao atualizar usuário", error: errorMessage });
  }
};

// Atualização de senha
export const updatePassword = async (req: Request, res: Response) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "Dados para atualização não fornecidos" });
    }
    const { currentPassword, newPassword } = req.body;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    // Verifica se a senha atual está correta
    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Senha atual incorreta" });
    }

    // Atualiza a senha
    const hashedNewPassword = await hashPassword(newPassword);
    user.password = hashedNewPassword;
    await user.save();

    res.json({ message: "Senha alterada com sucesso" });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    res.status(400).json({ message: "Erro ao alterar senha", error: errorMessage });
  }
};

// Deletar usuário
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user)
      return res.status(404).json({ message: "Usuário não encontrado" });

    res.json({ message: "Usuário deletado com sucesso" });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    res.status(500).json({ message: "Erro ao deletar usuário", error: errorMessage });
  }
};
