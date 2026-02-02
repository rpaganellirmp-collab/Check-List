-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'DRIVER');
CREATE TYPE "HandoverStatus" AS ENUM ('PENDING', 'COMPLETED');
CREATE TYPE "AccessoryAnswerValue" AS ENUM ('OK', 'FALTANDO', 'DANIFICADO', 'NA');
CREATE TYPE "QuickCheckValue" AS ENUM ('OK', 'IRREGULAR', 'NA');
CREATE TYPE "DamageType" AS ENUM ('RISCO', 'AMASSADO', 'TRINCA', 'QUEBRA', 'FALTA_PECA', 'DESALINHAMENTO', 'OUTRO');
CREATE TYPE "DamageSeverity" AS ENUM ('LEVE', 'MODERADA', 'GRAVE');
CREATE TYPE "DamageLocation" AS ENUM ('PARA_CHOQUE_DIANTEIRO', 'PARA_CHOQUE_TRASEIRO', 'CAPO', 'TETO', 'PARA_LAMA_ESQ', 'PARA_LAMA_DIR', 'PORTA_DIANTEIRA_ESQ', 'PORTA_DIANTEIRA_DIR', 'PORTA_TRASEIRA_ESQ', 'PORTA_TRASEIRA_DIR', 'LATERAL_ESQ', 'LATERAL_DIR', 'VIDRO_DIANTEIRO', 'VIDRO_TRASEIRO', 'FAROL_ESQ', 'FAROL_DIR', 'LANTERNA_ESQ', 'LANTERNA_DIR', 'RODA_PNEU', 'INTERIOR', 'OUTRO');
CREATE TYPE "OverallStatus" AS ENUM ('OK', 'ATENCAO', 'CRITICO');
CREATE TYPE "AttachmentOwnerType" AS ENUM ('RECEIPT_BASE', 'ACCESSORY', 'DAMAGE');
CREATE TYPE "BasePhotoType" AS ENUM ('ODOMETRO', 'FRENTE', 'TRASEIRA', 'LATERAL_ESQ', 'LATERAL_DIR', 'INTERIOR', 'AREA_CRITICA');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'DRIVER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "plate" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Handover" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "fromUserId" TEXT,
    "toUserId" TEXT NOT NULL,
    "status" "HandoverStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "Handover_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Receipt" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "handoverId" TEXT NOT NULL,
    "receiverUserId" TEXT NOT NULL,
    "odometer" INTEGER NOT NULL,
    "fuelLevel" TEXT,
    "overallStatus" "OverallStatus" NOT NULL,
    "protocol" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Receipt_handoverId_key" ON "Receipt"("handoverId");

CREATE TABLE "AccessoryTemplateItem" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AccessoryTemplateItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AccessoryAnswer" (
    "id" TEXT NOT NULL,
    "receiptId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "value" "AccessoryAnswerValue" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AccessoryAnswer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuickCheckItem" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuickCheckItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuickCheckAnswer" (
    "id" TEXT NOT NULL,
    "receiptId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "value" "QuickCheckValue" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuickCheckAnswer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Damage" (
    "id" TEXT NOT NULL,
    "receiptId" TEXT NOT NULL,
    "type" "DamageType" NOT NULL,
    "location" "DamageLocation" NOT NULL,
    "severity" "DamageSeverity" NOT NULL,
    "notes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Damage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "receiptId" TEXT NOT NULL,
    "ownerType" "AttachmentOwnerType" NOT NULL,
    "ownerId" TEXT,
    "basePhotoType" "BasePhotoType",
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Handover" ADD CONSTRAINT "Handover_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Handover" ADD CONSTRAINT "Handover_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Handover" ADD CONSTRAINT "Handover_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Handover" ADD CONSTRAINT "Handover_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_handoverId_fkey" FOREIGN KEY ("handoverId") REFERENCES "Handover"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_receiverUserId_fkey" FOREIGN KEY ("receiverUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AccessoryTemplateItem" ADD CONSTRAINT "AccessoryTemplateItem_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AccessoryAnswer" ADD CONSTRAINT "AccessoryAnswer_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "Receipt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AccessoryAnswer" ADD CONSTRAINT "AccessoryAnswer_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "AccessoryTemplateItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "QuickCheckItem" ADD CONSTRAINT "QuickCheckItem_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "QuickCheckAnswer" ADD CONSTRAINT "QuickCheckAnswer_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "Receipt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "QuickCheckAnswer" ADD CONSTRAINT "QuickCheckAnswer_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "QuickCheckItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Damage" ADD CONSTRAINT "Damage_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "Receipt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "Receipt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
