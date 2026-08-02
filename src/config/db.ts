import mongoose from "mongoose";
import { env } from "./env";
import { logger } from "../utils/logger";

export const connectDB = async (): Promise<void> => {
  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(env.MONGO_URI);
    logger.info("MongoDB connected successfully");
  } catch (error) {
    logger.error(`MongoDB connection failed: ${(error as Error).message}`);
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
  logger.info("MongoDB disconnected");
};
