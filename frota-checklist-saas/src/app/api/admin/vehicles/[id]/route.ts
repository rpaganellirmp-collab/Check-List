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

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireAdmin();
    const payload = vehicleSchema.parse(await request.json());
    const vehicle = await prisma.vehicle.update({
      where: { id: params.id },
      data: {
        ...payload,
        orgId: session.user.orgId
      }
    });
    return NextResponse.json(vehicle);
  } catch (error) {
    return NextResponse.json({ error: 'Falha ao atualizar veículo.' }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    await prisma.vehicle.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Falha ao remover veículo.' }, { status: 400 });
  }
}
