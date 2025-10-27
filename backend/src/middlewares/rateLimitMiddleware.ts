import rateLimit from "express-rate-limit"

// Global - para todas as rotas do sistema
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 reqs por IP
  message: "Muitas requisições deste IP, tente novamente mais tarde.",
  standardHeaders: true,
  legacyHeaders: false,
})

// Leve — para consultas de admin (pouco restritivo)
export const adminQueryLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 30, // limite de 30 requisições
  message: "Muitas requisições de leitura. Tente novamente em 1 minuto.",
})

// Moderado — para rotas sensíveis, como update-password ou admin register
export const sensitiveActionLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 15, // 15 requisições
  message: "Muitas tentativas. Tente novamente em 10 minutos.",
})

// Forte — para rotas públicas (login, register)
export const publicActionLimiter = rateLimit({
  windowMs: 20 * 60 * 1000, // 20 minutos
  max: 5, // 5 tentativas
  message: "Muitas tentativas. Tente novamente em 15 minutos.",
});