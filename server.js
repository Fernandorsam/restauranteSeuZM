// server.js
import app from "./src/app.js";
import connectDB from "./src/config/connectDb.js";
import { PORT, NODE_ENV } from "./src/config/environment.js";
import { error, info } from "./src/middlewares/logger.js";

// Tratamento de exceções não capturadas
process.on("uncaughtException", (err) => {
  error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  error(err.name, err.message);
  process.exit(1);
});

// Conectar ao banco de dados
connectDB();

// Iniciar servidor
const server = app.listen(PORT, () => {
  info(`Servidor rodando em modo ${NODE_ENV} na porta ${PORT}`);
  info(`Documentação disponível em: http://localhost:${PORT}/api-docs`);
});

// Tratamento de rejeições não tratadas
process.on("unhandledRejection", (err) => {
  error("UNHANDLED REJECTION! 💥 Shutting down...");
  error(err.name, err.message);

  server.close(() => {
    process.exit(1);
  });
});

// Graceful shutdown
process.on("SIGTERM", () => {
  info("👋 SIGTERM RECEIVED. Shutting down gracefully");
  server.close(() => {
    info("💥 Process terminated!");
  });
});
