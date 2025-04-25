// src/controllers/meeting.controller.ts
import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../interfaces/auth-request";

const prisma = new PrismaClient();

// Ambil semua meeting
export const getMeetings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const meetings = await prisma.meeting.findMany({
      include: {
        user: true,
        meetingRoom: true,
        department: true,
        approvals: true,
        histories: true,
        meetingEquipments: {
          include: {
            equipment: true,
          },
        },
      },
    });
    res.json(meetings);
  } catch (error) {
    console.error("Error getting meetings:", error);
    next(error);
  }
};

// Ambil meeting berdasarkan ID
export const getMeetingById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;
  try {
    const meeting = await prisma.meeting.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        user: true,
        meetingRoom: true,
        department: true,
        approvals: true,
        histories: true,
        meetingEquipments: {
          include: {
            equipment: true,
          },
        },
      },
    });

    if (!meeting) {
      res.status(404).json({ error: "Meeting tidak ditemukan" });
      return;
    }

    res.json(meeting);
  } catch (error) {
    console.error("Error getting meeting by ID:", error);
    next(error);
  }
};

// Tambah meeting baru
export const createMeeting = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const userId = req.user.id;
    const {
      agenda,
      gtimName,
      visitorName,
      companyName,
      startDate,
      endDate,
      startTime,
      endTime,
      request,
      meetingRoomId,
      departmentId,
      equipmentIds,
    } = req.body;

    console.log("INI NILAI REQBODY ===", req.body);
    console.log("Nilai meetingRoomId dari req.body:", meetingRoomId); // Tambahkan ini
    console.log("Nilai departmentId dari req.body:", departmentId);
    console.log("Nilai startDate dari req.body:", startDate);
    console.log("Nilai endDate dari req.body:", endDate);

    if (!startDate || !endDate) {
      res
        .status(400)
        .json({ message: "Tanggal mulai dan tanggal berakhir harus diisi." });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const meetingRoomIdNumber = Number(meetingRoomId); // Konversi ke number
    const departmentIdNumber = Number(departmentId); // Konversi ke number

    if (isNaN(meetingRoomIdNumber)) {
      res.status(400).json({ message: "ID Ruang Meeting tidak valid." });
      return;
    }

    if (isNaN(departmentIdNumber)) {
      res.status(400).json({ message: "ID Departemen tidak valid." });
      return;
    }

    const meetingRoom = await prisma.meetingRoom.findUnique({
      where: { id: meetingRoomIdNumber }, // Gunakan number yang sudah dikonversi
    });

    if (!meetingRoom) {
      res.status(400).json({ message: "Meeting room tidak ditemukan" });
      return;
    }

    const department = await prisma.department.findUnique({
      where: { id: departmentIdNumber }, // Gunakan number yang sudah dikonversi
    });

    if (!department) {
      res.status(400).json({ message: "Departemen tidak ditemukan" });
      return;
    }

    const isRoomBooked = await prisma.meeting.findFirst({
      where: {
        meetingRoomId: meetingRoom.id,
        startDate: { equals: start },
        OR: [
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gt: startTime } },
            ],
          },
        ],
        NOT: {
          id: undefined, // Untuk kasus update
        },
      },
    });

    if (isRoomBooked) {
      res.status(400).json({
        message:
          "Ruang meeting sudah dipesan pada tanggal dan waktu yang dipilih",
      });
      return;
    }

    // Validasi dan booking equipment
    if (
      equipmentIds &&
      Array.isArray(equipmentIds) &&
      equipmentIds.length > 0
    ) {
      const overlappingEquipmentBookings =
        await prisma.meetingEquipment.findMany({
          where: {
            equipmentId: { in: equipmentIds.map(Number) },
            meeting: {
              startDate: { equals: start },
              OR: [
                {
                  // Meeting baru mulai SEBELUM meeting lama berakhir DAN meeting baru berakhir SETELAH meeting lama mulai
                  AND: [
                    { startTime: { lt: endTime } },
                    { endTime: { gt: startTime } },
                  ],
                },
              ],
            },
          },
        });

      if (overlappingEquipmentBookings.length > 0) {
        res.status(400).json({
          message:
            "Satu atau lebih peralatan yang dipilih sudah dipesan pada waktu yang dipilih",
        });
        return; // Hentikan pembuatan meeting jika ada double booking equipment
      }

      const newMeeting = await prisma.meeting.create({
        data: {
          agenda,
          gtimName,
          visitorName,
          companyName,
          startDate: start,
          endDate: end,
          startTime,
          endTime,
          request,
          userId: userId,
          meetingRoomId: meetingRoom.id,
          departmentId: department.id,
          status: "PENDING",
          meetingEquipments: {
            createMany: {
              data: equipmentIds.map((equipmentId: any) => ({
                equipmentId: Number(equipmentId),
              })),
            },
          },
        },
        include: {
          meetingEquipments: {
            include: {
              equipment: true,
            },
          },
        },
      });

      res.status(201).json({
        message: "Meeting berhasil dibuat",
        meeting: newMeeting,
      });
      return;
    }

    // Jika tidak ada equipments
    const newMeeting = await prisma.meeting.create({
      data: {
        agenda,
        gtimName,
        visitorName,
        companyName,
        startDate: start,
        endDate: end,
        startTime,
        endTime,
        request,
        userId: userId,
        meetingRoomId: meetingRoom.id,
        departmentId: department.id,
        status: "PENDING",
      },
      include: {
        meetingEquipments: {
          include: {
            equipment: true,
          },
        },
      },
    });

    res.status(201).json({
      message: "Meeting berhasil dibuat",
      meeting: newMeeting,
    });
  } catch (error) {
    console.error("Error saat membuat meeting:", error);
    next(error);
  }
};

// Update meeting berdasarkan ID
export const updateMeeting = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;
  try {
    const meetingId = parseInt(id, 10);

    const existingMeeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: { meetingEquipments: true }, // Include existing equipment for comparison
    });

    if (!existingMeeting) {
      res.status(404).json({ error: "Meeting tidak ditemukan" });
      return;
    }

    // Tambahkan validasi untuk soft delete
    if (existingMeeting.isDeleted) {
      res
        .status(400)
        .json({ message: "Meeting ini sudah dihapus dan tidak dapat diubah." });
      return;
    }

    if (req.user?.role !== "ADMIN" && req.user?.id !== existingMeeting.userId) {
      res.status(403).json({
        error: "Anda tidak memiliki izin untuk memperbarui meeting ini",
      });
      return;
    }

    const {
      agenda,
      gtimName,
      visitorName,
      companyName,
      startDate,
      endDate,
      allDay,
      startTime,
      endTime,
      request,
      status,
      meetingRoomName,
      departmentName,
      equipmentIds,
    } = req.body;

    const start = startDate ? new Date(startDate) : existingMeeting.startDate;
    const end = endDate ? new Date(endDate) : existingMeeting.endDate;
    const roomId = meetingRoomName
      ? (
          await prisma.meetingRoom.findUnique({
            where: { name: meetingRoomName },
          })
        )?.id
      : existingMeeting.meetingRoomId;
    const deptId = departmentName
      ? (
          await prisma.department.findUnique({
            where: { name: departmentName },
          })
        )?.id
      : existingMeeting.departmentId;

    if (!roomId || !deptId) {
      res
        .status(400)
        .json({ message: "Ruang meeting atau departemen tidak ditemukan" });
      return;
    }

    // console.log("Start Date:", start);
    // console.log("End Date:", end);

    // Validasi tanggal HANYA jika startDate dan endDate ada dalam request DAN berbeda tanggal
    if (
      startDate &&
      endDate &&
      new Date(startDate).toDateString() !== new Date(endDate).toDateString()
    ) {
      if (new Date(startDate).getTime() >= new Date(endDate).getTime()) {
        res
          .status(400)
          .json({ message: "Tanggal berakhir harus setelah tanggal mulai" });
        return;
      }
    }

    const isRoomBooked = await prisma.meeting.findFirst({
      where: {
        id: { not: existingMeeting.id },
        meetingRoomId: roomId,
        startDate: { equals: start },
        isDeleted: false,
        OR: [
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gt: startTime } },
            ],
          },
        ],
      },
    });

    if (isRoomBooked) {
      res.status(400).json({
        message: "Ruang meeting sudah dipesan pada waktu yang dipilih",
      });
      return;
    }

    await prisma.$transaction(async (tx) => {
      // 1. Hapus peralatan lama
      await tx.meetingEquipment.deleteMany({
        where: { meetingId: meetingId },
      });

      const updatedMeetingData = {
        agenda,
        gtimName,
        visitorName,
        companyName,
        startDate: start,
        endDate: end,
        allDay,
        startTime,
        endTime,
        request,
        status,
        meetingRoomId: roomId,
        departmentId: deptId,
      };

      const updatedMeeting = await tx.meeting.update({
        where: { id: meetingId },
        data: updatedMeetingData,
      });

      if (
        equipmentIds &&
        Array.isArray(equipmentIds) &&
        equipmentIds.length > 0
      ) {
        const equipmentBookings = [];
        for (const equipmentId of equipmentIds) {
          const equipmentIdNum = Number(equipmentId);

          // 2. Query ketersediaan peralatan (hanya cari irisan waktu)
          const overlappingBookings = await tx.meetingEquipment.findMany({
            where: {
              equipmentId: equipmentIdNum,
              meeting: {
                id: { not: updatedMeeting.id },
                startDate: { equals: start },
                OR: [
                  {
                    AND: [
                      { startTime: { lt: endTime } },
                      { endTime: { gt: startTime } },
                    ],
                  },
                ],
              },
            },
          });

          // 3. Validasi ketersediaan (hanya jika ada irisan waktu)
          if (overlappingBookings.length > 0) {
            throw new Error(
              `Peralatan dengan ID ${equipmentIdNum} sudah dipesan pada waktu yang dipilih.`
            );
          }

          equipmentBookings.push({
            meetingId: updatedMeeting.id,
            equipmentId: equipmentIdNum,
          });
        }

        // 4. Buat relasi peralatan baru jika semua tersedia
        await tx.meetingEquipment.createMany({
          data: equipmentBookings,
        });
      }

      res.json({ message: "Meeting berhasil diupdate" });
    });
  } catch (error) {
    console.error("Error saat updateMeeting:", error);
    res.status(400).json({
      message: (error as Error).message || "Gagal memperbarui meeting.",
    });
    next(error);
  }
};

// Hapus meeting berdasarkan ID (soft delete)
export const deleteMeeting = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;
  try {
    const meetingId = parseInt(id, 10);

    const existingMeeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
    });

    if (!existingMeeting) {
      res.status(404).json({ error: "Meeting tidak ditemukan" });
      return;
    }

    if (req.user?.role !== "ADMIN" && req.user?.id !== existingMeeting.userId) {
      res.status(403).json({
        error: "Anda tidak memiliki izin untuk menghapus meeting ini",
      });
      return;
    }

    await prisma.$transaction(async (tx) => {
      // 1. Hapus relasi dengan peralatan
      await tx.meetingEquipment.deleteMany({
        where: { meetingId: meetingId },
      });

      // 2. Update status isDeleted pada meeting
      await tx.meeting.update({
        where: { id: meetingId },
        data: {
          isDeleted: true,
        },
      });
    });

    res.json({ message: "Meeting berhasil dihapus dari dashboard" });
  } catch (error) {
    console.error("Error saat menghapus meeting:", error);
    next(error);
  }
};
