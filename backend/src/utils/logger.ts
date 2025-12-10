import winston from "winston";
import path from "path";
import fs from "fs";

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Caminho base do projeto e pasta de logs
const appRoot = process.cwd();
const logDir = path.join(appRoot, "logs");

// Garante que a pasta de logs exista
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Formato customizado para console (legível)
const consoleFormat = printf(
  ({ level, message, timestamp, stack, ...metadata }) => {
    let msg = `${timestamp} | ${level} | ${message}`;

    // Adiciona metadados se existirem
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }

    // Adiciona stack trace se for erro
    if (stack) {
      msg += `\n${stack}`;
    }

    return msg;
  }
);

// Configuração dos transportes (destinos dos logs)
const transports: winston.transport[] = [
  new winston.transports.File({
    filename: path.join(logDir, "error.log"),
    level: "error",
    maxsize: 10485760, // 10MB em bytes
    maxFiles: 14, // mantém últimos 14 arquivos
    zippedArchive: true, // compacta logs antigos
  }),
  new winston.transports.File({
    filename: path.join(logDir, "combined.log"),
    maxsize: 20971520, // 20MB em bytes
    maxFiles: 14, // mantém últimos 14 arquivos
    zippedArchive: true,
  }),
];

// Cria logger com transporte de console explícito
const logger = winston.createLogger({
  level: (process.env.LOG_LEVEL as string) || "info",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }), // Captura stack trace de erros
    json() // Formato JSON para outros transportes
  ),
  transports: [
    // Console transport - SEMPRE ativo
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }), // Colorir no desenvolvimento
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        consoleFormat
      ),
      // CRÍTICO: Força saída para stdout
      stderrLevels: [], // Não usar stderr (Render pode não capturar)
      consoleWarnLevels: [], // Não usar console.warn
    }),
  ],
  // Em caso de erro no logger, joga no console nativo
  exceptionHandlers: [
    new winston.transports.Console({
      format: combine(colorize(), timestamp(), consoleFormat),
    }),
  ],
  rejectionHandlers: [
    new winston.transports.Console({
      format: combine(colorize(), timestamp(), consoleFormat),
    }),
  ],
});

logger.info("✅ Logger inicializado com sucesso");

// Exporta como default
export default logger;
