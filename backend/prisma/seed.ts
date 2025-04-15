import { PrismaClient, EquipmentType, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Hash password default
  const passwordHash = await bcrypt.hash("password123", 10);

  // Seed Users
  const users = [
    {
      userId: "1001",
      email: "admin@example.com",
      password: passwordHash,
      role: Role.ADMIN,
    },
    {
      userId: "2001",
      email: "approver1@example.com",
      password: passwordHash,
      role: Role.APPROVER,
    },
    {
      userId: "2002",
      email: "approver2@example.com",
      password: passwordHash,
      role: Role.APPROVER,
    },
    {
      userId: "3001",
      email: "user@example.com",
      password: passwordHash,
      role: Role.USER,
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
  }

  // Seed Meeting Rooms
  const meetingRooms = [
    "Meeting Room 01",
    "Meeting Room 02",
    "Meeting Room 04",
    "Meeting Room 05",
    "Conference Room",
    "Reception Room",
    "Opportunity Corner",
  ];

  await prisma.meetingRoom.createMany({
    data: meetingRooms.map((name) => ({ name })),
    skipDuplicates: true,
  });

  // Seed Departments
  const departments = [
    "Accounting",
    "HRGA",
    "Sales & Purchasing",
    "Engineering",
    "Quality",
    "PPIC",
    "Body Welding",
    "Body Press",
    "CVT",
    "Expatriate",
  ];

  await prisma.department.createMany({
    data: departments.map((name) => ({ name })),
    skipDuplicates: true,
  });

  // Seed Equipment
  const equipmentList = [
    { name: "Projector 01", type: EquipmentType.PROJECTOR },
    { name: "Projector 02", type: EquipmentType.PROJECTOR },
    { name: "Projector 03", type: EquipmentType.PROJECTOR },
    { name: "Projector 04", type: EquipmentType.PROJECTOR },
    { name: "Camera 01", type: EquipmentType.CAMERA },
    { name: "Camera 02", type: EquipmentType.CAMERA },
    { name: "Speaker 01", type: EquipmentType.SPEAKER },
    { name: "Speaker 02", type: EquipmentType.SPEAKER },
    { name: "Headphone 01", type: EquipmentType.HEADPHONE },
    { name: "Headphone 02", type: EquipmentType.HEADPHONE },
  ];

  await prisma.equipment.createMany({
    data: equipmentList,
    skipDuplicates: true,
  });

  console.log("✅ Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
