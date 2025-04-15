import express from "express";
import {
  createMeeting,
  deleteMeeting,
  getMeetings,
  getMeetingById,
  updateMeeting,
} from "../controllers/meeting.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/rbac.middleware"; // Asumsi Anda masih menggunakan ini untuk otorisasi

const router = express.Router();

// 1. Lihat semua daftar meeting (Semua user bisa akses)
router.get("/", authenticate, getMeetings);

// 2. Ambil detail meeting berdasarkan ID (Semua user bisa akses)
router.get("/:id", authenticate, getMeetingById);

// 3. Buat meeting baru (Hanya user dengan role ADMIN, APPROVER, USER yang bisa akses)
router.post(
  "/",
  authenticate,
  authorize(["ADMIN", "APPROVER", "USER"]),
  createMeeting
);

// 4. Update meeting berdasarkan ID (Hanya user yang membuat meeting atau ADMIN yang bisa akses)
router.put(
  "/:id",
  authenticate,
  // Anda mungkin perlu middleware otorisasi yang lebih spesifik di sini
  // untuk memeriksa apakah user yang mengupdate adalah pembuat atau ADMIN
  authorize(["ADMIN", "APPROVER", "USER"]),
  updateMeeting
);

// 5. Delete meeting berdasarkan ID (Hanya user yang membuat meeting atau ADMIN yang bisa akses)
router.delete(
  "/:id",
  authenticate,
  // Anda mungkin perlu middleware otorisasi yang lebih spesifik di sini
  // untuk memeriksa apakah user yang menghapus adalah pembuat atau ADMIN
  authorize(["ADMIN", "APPROVER", "USER"]),
  deleteMeeting
);

export default router;
