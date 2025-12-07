import User from "../models/User";
import {
    UserServiceResult,
    UserLoginServiceResult,
    CreateUserDTO,
    CreateUserByAdminDTO,
    IUserPayload,
    LoginUserDTO,
    UpdateUserDTO,
    UpdatePasswordDTO
} from "../types/userTypes";
import {
    hashPassword,
    generateToken,
    comparePassword
} from "../config/auth"
import { isValidObjectId } from "mongoose";

const escapeUserIdRegex = (text: string) => {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

export async function getUsersService(): Promise<UserServiceResult> {
    // Obtem todos os usuários e exclui o campo password na consulta
    const users = await User.find({}, "-password");

    return { status: 200, message: "Usuários encontrados com sucesso", users: users };
}

export async function getUserProfileService(userId: string): Promise<UserServiceResult> {
    // Obtem o perfil do usuário logado, excluindo o campo password
    const user = await User.findById(userId, "-password");
    if (!user) {
        return { status: 404, message: "Usuário não encontrado" };
    }

    return { status: 200, message: "Perfil do usuário encontrado com sucesso", user: user };
}

export async function getUserByIdService(userId: string): Promise<UserServiceResult> {
    // 1. Tenta buscar por ObjectId (se for válido)
    if (isValidObjectId(userId)) {
        const user = await User.findById(userId, "-password");
        if (user) {
            return { status: 200, message: "Usuário encontrado com sucesso", user: user };
        }
    }
    
    // 2. Busca flexível por userName, email ou name
    const escapedUserId = escapeUserIdRegex(userId);
        
    const users = await User.find({
        $or: [
            { userName: { $regex: escapedUserId, $options: 'i' } },
            { email: userId },
            { name: { $regex: escapedUserId, $options: 'i' } }
        ]
    }, "-password");
      
    if (!users || users.length === 0) {
        return { status: 404, message: "Usuário não encontrado" };
    }

    return { status: 200, message: `${users.length} usuário(s) encontrado(s)`, users: users };
}

export async function getUserByRoleService(userRole: string): Promise<UserServiceResult> {
    const users = await User.find({ role: userRole }, "-password");

    return { status: 200, message: "Usuários encontrados com sucesso", users: users };
}

export async function createUserService(body: CreateUserDTO): Promise<UserServiceResult> {
    const { userName, password, name, email, number } = body;

    // Verifica se já existe username ou email
    const existingUser = await User.findOne({ $or: [{ userName }, { email }] });
    if (existingUser) {
        return { status: 400, message: "Usuário ou e-mail já cadastrado" };
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

    return { status: 201, message: "Usuário criado com sucesso", user: savedNewUser };
}

export async function createUserByAdminService(body: CreateUserByAdminDTO): Promise<UserServiceResult> {
    const { userName, password, name, email, number, role } = body;

    // Verifica se já existe username ou email
    const existingUser = await User.findOne({ $or: [{ userName }, { email }] });
    if (existingUser) {
        return { status: 400, message: "Usuário ou e-mail já cadastrado" };
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

    return { status: 201, message: "Usuário criado com sucesso", user: savedNewUser };
}

export async function loginUserService(body: LoginUserDTO): Promise<UserLoginServiceResult> {
    const { userName, password } = body;

    // Busca usuário pelo userName
    const user = await User.findOne({ userName });
    if (!user || !(await comparePassword(password, user.password))) {
        return { status: 401, message: "Credenciais inválidas" };
    }

    // Gera token
    const token = generateToken(user as IUserPayload);

    return { status: 201, message: "Login realizado com sucesso", user: user, token: token };
}

export async function updateUserService(body: UpdateUserDTO, userId: string): Promise<UserServiceResult> {
    const { userName, name, email, number } = body;

    // Verifica se já existe username ou email em outro usuário
    const existingUser = await User.findOne({
        $or: [{ userName }, { email }],
        _id: { $ne: userId }, // ignora o próprio usuário
    });
    if (existingUser) {
        return { status: 400, message: "Usuário ou e-mail já cadastrado" };
    }

    // Atualiza somente os campos enviados (evita sobrescrever com undefined)
    const updatedUser = await User.findByIdAndUpdate(userId, { userName, name, email, number }, { new: true, select: "-password" });

    if (!updatedUser) {
        return { status: 404, message: "Usuário não encontrado" };
    }

    return { status: 201, message: "Dados atualizados com sucesso", user: updatedUser };
}

export async function updatePasswordService(body: UpdatePasswordDTO, userId: string): Promise<UserServiceResult> {
    const { currentPassword, newPassword } = body;

    const user = await User.findById(userId);
    if (!user) {
        return { status: 404, message: "Usuário não encontrado" };
    }

    // Verifica se a senha atual está correta
    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
        return { status: 400, message: "Senha atual incorreta" };
    }

    // Atualiza a senha
    const hashedNewPassword = await hashPassword(newPassword);
    user.password = hashedNewPassword;
    await user.save();

    return { status: 201, message: "Senha alterada com sucesso" };
}

export async function deleteUserService(userId: string): Promise<UserServiceResult> {
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
        return { status: 404, message: "Usuário não encontrado" }
    }

    return { status: 204, message: "Usuário deletado com sucesso" };
}
