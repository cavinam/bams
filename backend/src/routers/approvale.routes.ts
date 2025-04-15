// routes/approvalRoutes.ts
import express from "express";
import {
  processApproval,
  getPendingApprovals,
} from "@/controllers/approval.controller";
import { authenticate } from "@/middlewares/auth.middleware"; // Gunakan middleware Anda

const router = express.Router();

router.get("/pending", authenticate, getPendingApprovals);
router.post("/:approvalId", authenticate, processApproval);

export default router;
