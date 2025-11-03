import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";
import fs from "fs";

// Caminho base do projeto e pasta de logs
const appRoot = process.cwd();
const logDir = path.join(appRoot, "logs");

// Garante que a pasta de logs exista
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Formato personalizado do log
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(
    ({ level, message, timestamp }: winston.Logform.TransformableInfo) =>
      `[${timestamp}] ${level.toUpperCase()}: ${message}`
  )
);

// Configuração dos transportes (destinos dos logs)
const transports: winston.transport[] = [
  new DailyRotateFile({
    filename: path.join(logDir, "error-%DATE%.log"),
    datePattern: "YYYY-MM-DD",
    level: "error",
    maxSize: "10m",
    maxFiles: "14d", // mantém logs de até 14 dias
    zippedArchive: true, // compacta logs antigos
  }),
  new DailyRotateFile({
    filename: path.join(logDir, "combined-%DATE%.log"),
    datePattern: "YYYY-MM-DD",
    maxSize: "20m",
    maxFiles: "14d",
    zippedArchive: true,
  }),
];

// Em ambiente de desenvolvimento, também mostra no console
if (process.env.NODE_ENV !== "production") {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

// Cria o logger principal
const logger = winston.createLogger({
  level: (process.env.LOG_LEVEL as string) || "info",
  format: logFormat,
  transports,
});

// Exporta como default
export default logger;
