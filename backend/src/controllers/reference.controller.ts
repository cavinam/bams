// src/controllers/reference.controller.ts
import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../interfaces/auth-request"; // Jika autentikasi diperlukan

const prisma = new PrismaClient();

// Ambil semua ruang meeting
export const getMeetingRooms = async (
  req: AuthRequest, // Gunakan AuthRequest jika perlu autentikasi
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const meetingRooms = await prisma.meetingRoom.findMany({
      select: { id: true, name: true },
    });
    res.json(meetingRooms);
  } catch (error) {
    console.error("Error getting meeting rooms:", error);
    next(error);
  }
};

// Ambil semua departemen
export const getDepartments = async (
  req: AuthRequest, // Gunakan AuthRequest jika perlu autentikasi
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const departments = await prisma.department.findMany({
      select: { id: true, name: true },
    });
    res.json(departments);
  } catch (error) {
    console.error("Error getting departments:", error);
    next(error);
  }
};

// Ambil semua peralatan
export const getEquipments = async (
  req: AuthRequest, // Gunakan AuthRequest jika perlu autentikasi
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const equipments = await prisma.equipment.findMany({
      select: { id: true, name: true },
    });
    res.json(equipments);
  } catch (error) {
    console.error("Error getting equipments:", error);
    next(error);
  }
};
