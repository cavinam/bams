/*
  Warnings:

  - You are about to drop the column `approvalDate` on the `Meeting` table. All the data in the column will be lost.
  - You are about to drop the column `approvalNotes` on the `Meeting` table. All the data in the column will be lost.
  - You are about to drop the column `approverId` on the `Meeting` table. All the data in the column will be lost.
  - The `status` column on the `Meeting` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `type` on the `Equipment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EquipmentType" AS ENUM ('PROJECTOR', 'SPEAKER', 'CAMERA', 'HEADPHONE');

-- DropForeignKey
ALTER TABLE "Meeting" DROP CONSTRAINT "Meeting_approverId_fkey";

-- AlterTable
ALTER TABLE "Equipment" DROP COLUMN "type",
ADD COLUMN     "type" "EquipmentType" NOT NULL;

-- AlterTable
ALTER TABLE "Meeting" DROP COLUMN "approvalDate",
DROP COLUMN "approvalNotes",
DROP COLUMN "approverId",
DROP COLUMN "status",
ADD COLUMN     "status" "BookingStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "MeetingApproval" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeetingApproval_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MeetingApproval_meetingId_approverId_key" ON "MeetingApproval"("meetingId", "approverId");

-- AddForeignKey
ALTER TABLE "MeetingApproval" ADD CONSTRAINT "MeetingApproval_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingApproval" ADD CONSTRAINT "MeetingApproval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
