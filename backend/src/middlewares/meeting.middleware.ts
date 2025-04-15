// src/middlewares/meeting.middleware.ts
import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "@/interfaces/auth-request"; // Pastikan path ini benar

const prisma = new PrismaClient();

export const authorizeMeetingOwnership = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const meetingId = parseInt(req.params.id, 10);

    if (isNaN(meetingId)) {
      res.status(400).json({ message: "Invalid meeting ID" });
      return;
    }

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
    });

    if (!meeting) {
      res.status(404).json({ message: "Meeting not found" });
      return;
    }

    if (!req.user || (!req.user.id && req.user.id !== 0)) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const userId =
      typeof req.user.id === "string" ? parseInt(req.user.id, 10) : req.user.id;

    if (req.user.role === "ADMIN" || meeting.userId === userId) {
      next(); // User adalah ADMIN atau pemilik meeting, izinkan akses
    } else {
      res
        .status(403)
        .json({
          message: "Access denied. You are not the owner of this meeting.",
        });
    }
  } catch (error) {
    console.error("Error authorizing meeting ownership:", error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    await prisma.$disconnect();
  }
};
