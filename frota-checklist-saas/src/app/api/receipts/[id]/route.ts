import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireSession } from '@/lib/guards';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    const receipt = await prisma.receipt.findFirst({
      where:
        session.user.role === 'ADMIN'
          ? { id: params.id, orgId: session.user.orgId }
          : { id: params.id, orgId: session.user.orgId, receiverUserId: session.user.id },
      include: {
        handover: { include: { vehicle: true } },
        accessoryAnswers: { include: { item: true } },
        quickCheckAnswers: { include: { item: true } },
        damages: true,
        attachments: true
      }
    });

    if (!receipt) {
      return NextResponse.json({ error: 'Recibo não encontrado.' }, { status: 404 });
    }

    return NextResponse.json(receipt);
  } catch (error) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }
}
