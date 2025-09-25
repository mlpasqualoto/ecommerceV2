import User from "../models/User";
import {
    UserServiceResult,
    CreateUserDTO,
    CreateUserByAdminDTO
} from "../types/userTypes";
import { hashPassword } from "../config/auth"

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
    // Obtem o usuário pelo ID, excluindo o campo password
    const user = await User.findById(userId, "-password");
    if (!user) {
        return { status: 404, message: "Usuário não encontrado" };
    }

    return { status: 200, message: "Usuário encontrado com sucesso", user: user };
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
