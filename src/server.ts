import app from "./app";
import { env } from "./config/env";
import { connectDB, disconnectDB } from "./config/db";
import { logger } from "./utils/logger";
import "./cron/lowStock.cron";

const PORT = Number(env.PORT);

const start = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    logger.info(`🌲 KathKhata AI API running on port ${PORT} [${env.NODE_ENV}]`);
    logger.info(`📚 Swagger docs at http://localhost:${PORT}/api-docs`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await disconnectDB();
      logger.info("Server closed. Process exiting.");
      process.exit(0);
    });

    setTimeout(() => {
      logger.error("Forced shutdown after timeout");
      process.exit(1);
    }, 10000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("unhandledRejection", (reason) => {
    logger.error(`Unhandled Rejection: ${reason}`);
  });
};

start().catch((err) => {
  logger.error(`Failed to start server: ${err.message}`);
  process.exit(1);
});
