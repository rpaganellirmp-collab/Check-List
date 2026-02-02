import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/guards';

export async function GET() {
  try {
    const session = await requireAdmin();
    const users = await prisma.user.findMany({
      where: { orgId: session.user.orgId },
      orderBy: { createdAt: 'asc' }
    });
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }
}
