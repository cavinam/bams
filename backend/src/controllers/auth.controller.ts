// src/controllers/auth.controller.ts
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { userId }, // Atau email, sesuaikan dengan field login Anda
    });

    if (!user) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Pastikan user.id (dari database) dimasukkan sebagai number ke dalam payload
    const token = jwt.sign(
      {
        id: user.id, // Ini HARUS berupa number dari database
        role: user.role,
      },
      process.env.JWT_SECRET || "your-secret-key", // Gunakan environment variable
      { expiresIn: "1h" }
    );

    res.status(200).json({ token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
