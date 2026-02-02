import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/guards';
import { z } from 'zod';

const handoverSchema = z.object({
  vehicleId: z.string(),
  toUserId: z.string(),
  fromUserId: z.string().optional()
});

export async function GET() {
  try {
    const session = await requireAdmin();
    const handovers = await prisma.handover.findMany({
      where: { orgId: session.user.orgId },
      include: { vehicle: true, toUser: true, receipt: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(handovers);
  } catch (error) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    const payload = handoverSchema.parse(await request.json());
    const handover = await prisma.handover.create({
      data: {
        orgId: session.user.orgId,
        vehicleId: payload.vehicleId,
        toUserId: payload.toUserId,
        fromUserId: payload.fromUserId ?? session.user.id,
        status: 'PENDING'
      }
    });
    return NextResponse.json(handover, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Falha ao criar handover.' }, { status: 400 });
  }
}
