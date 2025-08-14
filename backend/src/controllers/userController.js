import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// Obter todos os usuários
export const getUsers = async (req, res) => {
    try {
        const users = await User.find({}, "-password"); // exclui o campo password

        res.json({ message: "Usuários encontrados com sucesso", users: users });
    } catch (err) {
        res.status(500).json({ message: "Erro ao buscar usuários", error: err.message });
    }
};

// Obter perfil do usuário
export const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id, "-password");
        if (!user) {
            return res.status(404).json({ message: "Usuário não encontrado" });
        }
        res.json({ message: "Perfil do usuário encontrado com sucesso", user: user });
    } catch (err) {
        res.status(500).json({ message: "Erro ao buscar perfil", error: err.message });
    }
};

// Criação de um novo usuário
export const createUser = async (req, res) => {
    try {
        const { userName, password, name, email, number, role } = req.body;

        // Verifica se já existe username ou email
        const existingUser = await User.findOne({ $or: [{ userName }, { email }] });
        if (existingUser) return res.status(400).json({ message: "Usuário ou e-mail já cadastrado" });

        // Criptografa a senha
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            userName,
            password: hashedPassword,
            name,
            email,
            number,
            role
        });

        const savedNewUser = await newUser.save();
        res.status(201).json({ message: "Usuário criado com sucesso", user: savedNewUser });
    } catch (err) {
        res.status(400).json({ message: "Erro ao criar usuário", error: err.message });
    }
};

// Login do usuário
export const loginUser = async (req, res) => {
    try {
        const { userName, password } = req.body;

        // Busca usuário pelo userName
        const user = await User.findOne({ userName });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: "Credenciais inválidas" });
        }

        // Gera token
        const token = jwt.sign(
            { id: user._id, userName: user.userName },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({ message: "Login realizado com sucesso", token: token });
    } catch (err) {
        res.status(500).json({ message: "Erro ao fazer login", error: err.message });
    }
};

// Atualização de usuário
export const updateUser = async (req, res) => {
    try {
        const { userName, name, email, number } = req.body;

        // Verifica se já existe username ou email em outro usuário
        const existingUser = await User.findOne({
            $or: [{ userName }, { email }],
            _id: { $ne: req.user.id } // ignora o próprio usuário
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
        res.status(400).json({ message: "Erro ao atualizar usuário", error: err.message });
    }
}

// Atualização de senha
export const updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "Usuário não encontrado" });

        // Verifica se a senha atual está correta
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: "Senha atual incorreta" });

        // Atualiza a senha
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedNewPassword;
        await user.save();

        res.json({ message: "Senha alterada com sucesso" });
    } catch (err) {
        res.status(400).json({ message: "Erro ao alterar senha", error: err.message });
    }
}

// Deletar usuário
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: "Usuário não encontrado" });

        res.json({ message: "Usuário deletado com sucesso" });
    } catch (err) {
        res.status(500).json({ message: "Erro ao deletar usuário", error: err.message });
    }
};
