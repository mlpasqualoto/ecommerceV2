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
import { errorMiddleware } from "./src/middlewares/errorMiddleware"

dotenv.config();

const app = express();

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

const allowedOrigins = [
  "http://localhost:3000",
  "http://192.168.25.110:3000" // seu IP da rede
];

app.use(cors({
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Permite requisições sem "origin" (como apps mobile ou Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(globalLimiter); // insere middleware express-rate-limit globalmente

connectDB();

// Rotas
app.use("/api/orders", orderRoutes);
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);

// Middleware global de erro
app.use(errorMiddleware);

app.get("/", (req: express.Request, res: express.Response) => {
  res.send("API do E-commerce rodando 🚀");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
