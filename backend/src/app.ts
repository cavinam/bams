import express from "express";
import cors from "cors";
import authRoutes from "./routers/auth.routes";
import meetingRoutes from "./routers/meeting.routes";
import { authenticate } from "./middlewares/auth.middleware";

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/meetings", authenticate, meetingRoutes); // 🔹 Proteksi route meetings

export default app;
