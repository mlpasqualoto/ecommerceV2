import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import authenticateToken from "../middlewares/authMiddleware.js";

const router = express.Router();

// Rota para obter todos os usuários
router.get("/", authenticateToken, (req, res) => {
  res.json(users.map(({ password, ...rest }) => rest));
});

// Rota para obter o perfil do usuário autenticado
router.get("/profile", authenticateToken, (req, res) => {
  const user = users.find((u) => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ message: "Usuário não encontrado" });
  }
  res.json({ id: user.id, username: user.username });
});

// Rota para registro de um novo usuário
router.post("/register", async (req, res) => {
  const { username, password, name, email, number } = req.body;

  if (users.find((u) => u.username === username)) {
    return res.status(400).json({ message: "Usuário já existe" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { id: Date.now(), username, password: hashedPassword, name, email, number };
  users.push(newUser);

  res.status(201).json({ message: "Usuário criado com sucesso" });
});

// Rota para login de usuário
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = users.find((u) => u.username === username);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "Credenciais inválidas" });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET,
    {
      expiresIn: "1h",
    }
  );

  res.json({ token });
});

export default router;
