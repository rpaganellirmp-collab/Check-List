import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireSession } from '@/lib/guards';

export async function GET() {
  try {
    const session = await requireSession();

    const where =
      session.user.role === 'ADMIN'
        ? { orgId: session.user.orgId }
        : { orgId: session.user.orgId, toUserId: session.user.id };

    const handovers = await prisma.handover.findMany({
      where,
      include: {
        vehicle: true,
        toUser: true,
        receipt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(handovers);
  } catch (error) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }
}
