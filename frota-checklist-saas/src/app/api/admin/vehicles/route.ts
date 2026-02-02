import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/guards';
import { z } from 'zod';

const vehicleSchema = z.object({
  plate: z.string().min(1),
  brand: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().optional()
});

export async function GET() {
  try {
    const session = await requireAdmin();
    const vehicles = await prisma.vehicle.findMany({
      where: { orgId: session.user.orgId },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(vehicles);
  } catch (error) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    const payload = vehicleSchema.parse(await request.json());
    const vehicle = await prisma.vehicle.create({
      data: {
        orgId: session.user.orgId,
        ...payload
      }
    });
    return NextResponse.json(vehicle, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Falha ao criar veículo.' }, { status: 400 });
  }
}
