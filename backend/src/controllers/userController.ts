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
import { NextFunction, Request, Response } from "express";

// Obter todos os usuários (admin)
export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await getUsersService();
    if (!users) {
      const error = new Error("Erro ao buscar usuários.");
      (error as any).statusCode = 500;
      return next(error);
    }

    return res.status(users.status ?? 200).json({ message: users.message, users: users.users ?? null });
  } catch (error) {
    return next(error);
  }
};

// Obter perfil do usuário (user)
export const getUserProfile = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.id) {
    const error = new Error("Não autenticado.");
    (error as any).statusCode = 401;
    return next(error);
  }
  try {
    const userProfile = await getUserProfileService(req.user.id);
    if (!userProfile) {
      const error = new Error("Erro ao buscar perfil.");
      (error as any).statusCode = 500;
      return next(error);
    }

    return res.status(userProfile.status ?? 200).json({ message: userProfile.message, user: userProfile.user ?? null });
  } catch (error) {
    return next(error);
  }
};

// Obter usuário por ID (admin)
export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.params.id) {
    const error = new Error("Id do usuário não fornecido.");
    (error as any).statusCode = 404;
    return next(error);
  }
  try {
    const userResult = await getUserByIdService(req.params.id);
    if (!userResult) {
      const error = new Error("Erro ao buscar usuário.");
      (error as any).statusCode = 500;
      return next(error);
    }

    return res.status(userResult.status ?? 200).json({ message: userResult.message, user: userResult.user ?? null, users: userResult.users ?? null });
  } catch (error) {
    return next(error);
  }
};

// Obter usuários por função (admin)
export const getUsersByRole = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.params.role) {
    const error = new Error("Função (role) não fornecida.");
    (error as any).statusCode = 404;
    return next(error);
  }
  try {
    const usersResult = await getUserByRoleService(req.params.role)
    if (!usersResult) {
      const error = new Error("Erro ao buscar usuários.");
      (error as any).statusCode = 500;
      return next(error);
    }

    return res.status(usersResult.status ?? 200).json({ message: usersResult.message, users: usersResult.users ?? null });
  } catch (error) {
    return next(error);
  }
};

// Rota para obter informações do usuário logado (user)
// Lógica no controller
export const getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.id || !req.user.userName || !req.user.role) {
    const error = new Error("Não autenticado.");
    (error as any).statusCode = 401;
    return next(error);
  }
  try {
    return res.status(200).json({ id: req.user.id, userName: req.user.userName, role: req.user.role });
  } catch (error) {
    return next(error);
  }
};

// Criação de usuário (public)
export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    const error = new Error("Dados do usuário não fornecidos.");
    (error as any).statusCode = 400;
    return next(error);
  }
  try {
    const savedNewUser = await createUserService(req.body)
    if (!savedNewUser) {
      const error = new Error("Erro ao criar usuário.");
      (error as any).statusCode = 400;
      return next(error);
    }

    return res.status(savedNewUser.status ?? 200).json({ message: savedNewUser.message, user: savedNewUser.user ?? null })
  } catch (error) {
    return next(error);
  }
};

// Criação de usuário protegida (admin)
export const createUserByAdmin = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    const error = new Error("Dados do usuário não fornecidos.");
    (error as any).statusCode = 400;
    return next(error);
  }

  const { role } = req.body;
  // 🔒 só admins podem criar admins
  if (!req.user || !req.user.role) {
    const error = new Error("Não autenticado.");
    (error as any).statusCode = 401;
    return next(error);
  }
  if (role === "admin" && req.user.role !== "admin") {
    const error = new Error("Somente administradores podem criar outros administradores.");
    (error as any).statusCode = 403;
    return next(error);
  }
  try {
    const savedNewUser = await createUserByAdminService(req.body);
    if (!savedNewUser) {
      const error = new Error("Error ao criar usuário.");
      (error as any).statusCode = 400;
      return next(error);
    }

    return res.status(savedNewUser.status ?? 200).json({ message: savedNewUser.message, user: savedNewUser.user ?? null });
  } catch (error) {
    return next(error);
  }
};

// Login do usuário (public)
export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    const error = new Error("Dados de login não fornecidos.");
    (error as any).statusCode = 400;
    return next(error);
  }
  try {
    const loginResult = await loginUserService(req.body)
    if (!loginResult) {
      const error = new Error("Erro ao fazer login.");
      (error as any).statusCode = 500;
      return next(error);
    }

    if (loginResult.status !== 201 || !loginResult.token) {
      return res.status(loginResult.status ?? 500).json({ message: loginResult.message })
    }

    // Envia o token como cookie HTTP-only
    res.cookie("token", loginResult.token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 3600000, // 1 hora
      //domain: "localhost" para testes locais
    });

    return res.status(loginResult.status ?? 200).json({ message: loginResult.message, user: loginResult.user ?? null, token: loginResult.token ?? null });
  } catch (error) {
    return next(error);
  }
};

// Logout do usuário (public)
// Lógica no controller
export const logoutUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.clearCookie("token");
    return res.status(200).json({ message: "Logout realizado com sucesso" });
  } catch (error) {
    return next(error);
  }
};

// Atualização de usuário (user)
export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    const error = new Error("Dados para atualização não fornecidos.");
    (error as any).statusCode = 400;
    return next(error);
  }
  if (!req.user || !req.user.id) {
    const error = new Error("Não autenticado.");
    (error as any).statusCode = 401;
    return next(error);
  }
  try {
    const updatedUser = await updateUserService(req.body, req.user.id)
    if (!updatedUser) {
      const error = new Error("Erro ao atualizar usuário.");
      (error as any).statusCode = 400;
      return next(error);
    }

    return res.status(updatedUser.status ?? 200).json({ message: updatedUser.message, user: updatedUser.user ?? null });
  } catch (error) {
    return next(error);
  }
};

// Atualização de senha (user)
export const updatePassword = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    const error = new Error("Dados para atualização não fornecidos.");
    (error as any).statusCode = 400;
    return next(error);
  }
  if (!req.user || !req.user.id) {
    const error = new Error("Não autenticado.");
    (error as any).statusCode = 401;
    return next(error);
  }
  try {
    const updatedPassword = await updatePasswordService(req.body, req.user.id)
    if (!updatedPassword) {
      const error = new Error("Erro ao alterar senha.");
      (error as any).statusCode = 400;
      return next(error);
    }
    
    return res.status(updatedPassword.status ?? 200).json({ message: updatedPassword.message });
  } catch (error) {
    return next(error);
  }
};

// Deletar usuário (admin)
export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.params.id) {
    const error = new Error("Dado não fornecido.");
    (error as any).statusCode = 400;
    return next(error);
  }
  try {
    const deletedUser = await deleteUserService(req.params.id);
    if (!deletedUser) {
      const error = new Error("Erro ao deletar usuário.");
      (error as any).statusCode = 500;
      return next(error);
    }

    return res.status(deletedUser.status ?? 200).json({ message: deletedUser.message });
  } catch (error) {
    return next(error);
  }
};
