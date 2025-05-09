// src/config.ts
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});
export default prisma;
