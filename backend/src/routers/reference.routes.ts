// src/routes/reference.routes.ts
import express from "express";
import {
  getMeetingRooms,
  getDepartments,
  getEquipments,
} from "../controllers/reference.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = express.Router();

router.get("/meeting-rooms", authenticate, getMeetingRooms);
router.get("/departments", authenticate, getDepartments);
router.get("/equipments", authenticate, getEquipments);

export default router; // Pastikan Anda mengekspor 'router'
