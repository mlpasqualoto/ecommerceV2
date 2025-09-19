import User from "../models/User";
import {
  generateToken,
  hashPassword,
  comparePassword
} from "../config/auth";
import authenticateToken from "../middlewares/authMiddleware";
import { Request, Response } from "express";

interface IUserPayload {
  _id: string;
  userName: string;
  role: "user" | "admin";
}

// Obter todos os usuários
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find({}, "-password"); // exclui o campo password

    res.json({ message: "Usuários encontrados com sucesso", users: users });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    res.status(500).json({ message: "Erro ao buscar usuários", error: errorMessage });
  }
};

// Obter perfil do usuário
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    const user = await User.findById(req.user.id, "-password");
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }
    res.json({
      message: "Perfil do usuário encontrado com sucesso",
      user: user,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    res.status(500).json({ message: "Erro ao buscar perfil", error: errorMessage });
  }
};

// Obter usuário por ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    if (!req.params || !req.params.id) {
      return res.status(400).json({ message: "ID do usuário não fornecido" });
    }
    const user = await User.findById(req.params.id, "-password");

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }
    res.json({
      message: "Usuário encontrado com sucesso",
      user: user,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    res.status(500).json({ message: "Erro ao buscar usuário", error: errorMessage });
  }
};

// Obter usuários por função (role)
export const getUsersByRole = async (req: Request, res: Response) => {
  try {
    if (!req.params || !req.params.role) {
      return res.status(400).json({ message: "Função (role) não fornecida" });
    }
    const role = req.params.role;

    const users = await User.find({ role }, "-password");
    res.json({
      message: "Usuários encontrados com sucesso",
      users: users,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    res.status(500).json({ message: "Erro ao buscar usuários", error: errorMessage });
  }
};

// Rota para obter informações do usuário logado
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.id || !req.user.userName || !req.user.role) {
      return res.status(401).json({ message: "Não autenticado" });
    }

    res.json({
      id: req.user.id,
      userName: req.user.userName,
      role: req.user.role,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    res.status(500).json({ message: "Erro ao obter usuário", error: errorMessage });
  }
};

// Criação de usuário público (sempre role: "user")
export const createUser = async (req: Request, res: Response) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "Dados do usuário não fornecidos" });
    }
    const { userName, password, name, email, number } = req.body;

    // Verifica se já existe username ou email
    const existingUser = await User.findOne({ $or: [{ userName }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: "Usuário ou e-mail já cadastrado" });
    }

    // Criptografa a senha
    const hashedPassword = await hashPassword(password);

    const newUser = new User({
      userName,
      password: hashedPassword,
      name,
      email,
      number,
      role: "user",
    });

    const savedNewUser = await newUser.save();
    res.status(201).json({ message: "Usuário criado com sucesso", user: savedNewUser });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    res.status(400).json({ message: "Erro ao criar usuário", error: errorMessage });
  }
};

// Criação de usuário protegida (somente admin pode criar outro admin)
export const createUserByAdmin = async (req: Request, res: Response) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "Dados do usuário não fornecidos" });
    }
    const { userName, password, name, email, number, role } = req.body;

    // 🔒 só admins podem criar admins
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    if (role === "admin" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Somente administradores podem criar outros administradores" });
    }

    // Verifica se já existe username ou email
    const existingUser = await User.findOne({ $or: [{ userName }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: "Usuário ou e-mail já cadastrado" });
    }

    // Criptografa a senha
    const hashedPassword = await hashPassword(password);

    const newUser = new User({
      userName,
      password: hashedPassword,
      name,
      email,
      number,
      role: role,
    });

    const savedNewUser = await newUser.save();
    res.status(201).json({ message: "Usuário criado com sucesso", user: savedNewUser });
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
