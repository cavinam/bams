import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../interfaces/auth-request"; // Pastikan path ini benar

const prisma = new PrismaClient();

export const getPendingApprovals = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user?.role !== "APPROVER") {
      res.status(403).json({
        error: "Anda tidak memiliki izin untuk melihat daftar approval.",
      });
      return;
    }

    const pendingApprovals = await prisma.meetingApproval.findMany({
      where: {
        approverId: req.user.id,
        status: "PENDING",
      },
      include: {
        meeting: {
          include: {
            user: true,
            meetingRoom: true,
            department: true,
            meetingEquipments: {
              include: {
                equipment: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json({ approvals: pendingApprovals });
  } catch (error) {
    console.error("Error saat mengambil daftar approval yang menunggu:", error);
    next(error);
  }
};

export const processApproval = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { approvalId } = req.params;
  const { action, reason } = req.body; // action bisa 'APPROVE' atau 'REJECT'

  try {
    if (req.user?.role !== "APPROVER") {
      res
        .status(403)
        .json({ error: "Anda tidak memiliki izin untuk melakukan approval." });
      return;
    }

    const approval = await prisma.meetingApproval.findUnique({
      where: { id: parseInt(approvalId, 10), approverId: req.user.id },
      include: { meeting: { include: { user: true } } },
    });

    if (!approval) {
      res
        .status(404)
        .json({
          error:
            "Permintaan approval tidak ditemukan atau bukan wewenang Anda.",
        });
      return;
    }

    if (approval.status !== "PENDING") {
      res
        .status(400)
        .json({ message: "Permintaan approval ini sudah diproses." });
      return;
    }

    if (action === "APPROVE") {
      // Cari Approver 2 (sementara ambil approver lain dengan role APPROVER yang berbeda)
      const approver2 = await prisma.user.findFirst({
        where: { role: "APPROVER", NOT: { id: approval.approverId } },
      });

      if (approver2) {
        await prisma.meetingApproval.create({
          data: {
            meetingId: approval.meetingId,
            approverId: approver2.id,
          },
        });
        await prisma.meetingApproval.update({
          where: { id: approval.id },
          data: { status: "APPROVED" },
        });
        await prisma.meeting.update({
          where: { id: approval.meetingId },
          data: { status: "WAITING_SECOND_APPROVAL" },
        });
        console.log(
          `Notifikasi: Meeting ID ${approval.meetingId} disetujui oleh ${req.user.email}, menunggu approval dari ${approver2.email}`
        );
        res
          .status(200)
          .json({
            message:
              "Meeting berhasil disetujui dan menunggu approval selanjutnya.",
          });
      } else {
        // Jika tidak ada Approver 2, langsung approve meeting
        await prisma.meeting.update({
          where: { id: approval.meetingId },
          data: { status: "APPROVED" },
        });
        await prisma.meetingApproval.update({
          where: { id: approval.id },
          data: { status: "APPROVED" },
        });
        console.log(
          `Notifikasi: Meeting ID ${approval.meetingId} disetujui oleh ${req.user.email} dan status meeting menjadi APPROVED.`
        );
        res.status(200).json({ message: "Meeting berhasil disetujui." });
      }
    } else if (action === "REJECT") {
      if (!reason) {
        res.status(400).json({ error: "Alasan penolakan wajib diisi." });
        return;
      }
      await prisma.meeting.update({
        where: { id: approval.meetingId },
        data: { status: "REJECTED" },
      });
      await prisma.meetingApproval.update({
        where: { id: approval.id },
        data: { status: "REJECTED", reason },
      });
      console.log(
        `Notifikasi: Meeting ID ${approval.meetingId} ditolak oleh ${req.user.email} dengan alasan: ${reason}`
      );
      // Implementasi notifikasi ke user bisa ditambahkan di sini
      res.status(200).json({ message: "Meeting berhasil ditolak.", reason });
    } else {
      res
        .status(400)
        .json({
          error: 'Aksi tidak valid. Harap gunakan "APPROVE" atau "REJECT".',
        });
    }
  } catch (error) {
    console.error("Error saat memproses approval:", error);
    next(error);
  }
};
