import { z } from 'zod';
import {
  AccessoryAnswerValue,
  QuickCheckValue,
  DamageSeverity,
  DamageType,
  DamageLocation,
  BasePhotoType
} from '@prisma/client';

export const basePhotoTypes = [
  BasePhotoType.ODOMETRO,
  BasePhotoType.FRENTE,
  BasePhotoType.TRASEIRA,
  BasePhotoType.LATERAL_ESQ,
  BasePhotoType.LATERAL_DIR,
  BasePhotoType.INTERIOR,
  BasePhotoType.AREA_CRITICA
] as const;

export const receiptBasePhotoSchema = z.object({
  basePhotoType: z.enum(basePhotoTypes),
  filePath: z.string(),
  mimeType: z.string()
});

export const accessoryAnswerSchema = z.object({
  itemId: z.string(),
  value: z.nativeEnum(AccessoryAnswerValue),
  notes: z.string().optional(),
  attachments: z.array(z.object({ filePath: z.string(), mimeType: z.string() })).optional()
});

export const quickCheckAnswerSchema = z.object({
  itemId: z.string(),
  value: z.nativeEnum(QuickCheckValue),
  notes: z.string().optional(),
  attachments: z.array(z.object({ filePath: z.string(), mimeType: z.string() })).optional()
});

export const damageSchema = z.object({
  type: z.nativeEnum(DamageType),
  location: z.nativeEnum(DamageLocation),
  severity: z.nativeEnum(DamageSeverity),
  notes: z.string().min(1),
  attachments: z.array(z.object({ filePath: z.string(), mimeType: z.string() }))
});

export const receiptSchema = z.object({
  handoverId: z.string(),
  odometer: z.number().int().positive(),
  fuelLevel: z.string().optional(),
  basePhotos: z.array(receiptBasePhotoSchema),
  accessories: z.array(accessoryAnswerSchema),
  quickChecks: z.array(quickCheckAnswerSchema),
  damages: z.array(damageSchema)
});

export type ReceiptPayload = z.infer<typeof receiptSchema>;
