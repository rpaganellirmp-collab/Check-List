import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/guards';

export async function GET() {
  try {
    const session = await requireAdmin();
    const receipts = await prisma.receipt.findMany({
      where: { orgId: session.user.orgId },
      include: {
        handover: { include: { vehicle: true } },
        receiver: true,
        damages: true,
        accessoryAnswers: true
      },
      orderBy: { submittedAt: 'desc' }
    });
    return NextResponse.json(receipts);
  } catch (error) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }
}
