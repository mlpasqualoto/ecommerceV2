import User from "../models/User";
import { UserServiceResult } from "../controllers/userController";

export async function getUsersService(): Promise<UserServiceResult> {
    const users = await User.find({}, "-password"); // exclui o campo password

    return { status: 200, message: "Usuários encontrados com sucesso", users: users };
}

export async function getUserProfileService(userId: string): Promise<UserServiceResult> {
    const user = await User.findById(userId, "-password");
    if (!user) {
        return { status: 404, message: "Usuário não encontrado" };
    }
    return { status: 200, message: "Perfil do usuário encontrado com sucesso", user: user };
}
