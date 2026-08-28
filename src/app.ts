import express, { Application, Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import compression from "compression";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env";
import { swaggerSpec } from "./config/swagger";
import apiRoutes from "./routes";
import { globalLimiter } from "./middlewares/rateLimiter.middleware";
import { notFoundHandler, errorHandler } from "./middlewares/errorHandler.middleware";
import { logger } from "./utils/logger";

const app: Application = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true
  })
);
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(env.COOKIE_SECRET));
app.use(
  morgan("combined", {
    stream: { write: (message: string) => logger.info(message.trim()) }
  })
);
app.use(globalLimiter);

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: "KathKhata AI API is healthy", timestamp: new Date() });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/v1", apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);    

export default app;             
