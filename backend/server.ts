import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import { globalLimiter } from "./src/middlewares/rateLimitMiddleware";
import connectDB from "./src/config/db";
import orderRoutes from "./src/routes/orderRoutes";
import productRoutes from "./src/routes/productRoutes";
import userRoutes from "./src/routes/userRoutes";
import cookieParser from "cookie-parser";
import { errorMiddleware } from "./src/middlewares/errorMiddleware";
import expressWinston from "express-winston";
import logger from "./src/utils/logger"
import { startSchedulers } from "./src/services/integrations/scheduler";

dotenv.config();

const app = express();

// para apps atrás de um proxy (ex: Render.com)
app.set("trust proxy", 1);

// ativar em produção
/*
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"], // somente o mesmo domínio
        "img-src": ["'self'", "data:", "https:"], // imagens locais e externas seguras
        "script-src": ["'self'", "https://www.googletagmanager.com", "https://www.google-analytics.com"], // scripts confiáveis
        "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"], // CSS local e do Google Fonts
        "font-src": ["'self'", "https://fonts.gstatic.com"], // fontes seguras
        "connect-src": ["'self'", "https://api.stripe.com", "https://api.mercadopago.com"], // conexões para APIs externas
      },
    },
    crossOriginEmbedderPolicy: false, // evita bloqueio de conteúdo de terceiros
    crossOriginResourcePolicy: { policy: "cross-origin" }, // permite recursos externos (CDNs, imagens, etc.)
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }, // compatível com janelas popup (checkout)
    frameguard: { action: "deny" }, // impede clickjacking
    referrerPolicy: { policy: "no-referrer" }, // não envia referenciadores
    hidePoweredBy: true, // remove o cabeçalho X-Powered-By
    hsts: { maxAge: 63072000, includeSubDomains: true, preload: true }, // força HTTPS
    noSniff: true, // impede que o navegador tente adivinhar tipo MIME
    xssFilter: true, // ativa proteção contra XSS
  })
)
*/

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}))

app.use(cors({
  origin: ["http://localhost:3000"],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(globalLimiter); // insere middleware express-rate-limit globalmente

// middleware de logging
app.use(
  expressWinston.logger({
    winstonInstance: logger,
    meta: false,
    msg: "{{req.method}} {{req.url}} {{res.statusCode}} - {{res.responseTime}}ms",
    colorize: false,
  })
);

// conexao com db
connectDB();

// rotas
app.use("/api/orders", orderRoutes);
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);

// middleware global de erro
app.use(errorMiddleware);

// rota de teste
app.get("/", (req: express.Request, res: express.Response) => {
  res.send("API do E-commerce rodando 🚀");
});

// porta
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);

  // Inicia os agendadores
  startSchedulers();
});
