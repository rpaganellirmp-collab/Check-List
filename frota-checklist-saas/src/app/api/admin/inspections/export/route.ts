import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/guards';

function toCsv(rows: string[][]) {
  return rows.map((row) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(',')).join('\n');
}

export async function GET() {
  try {
    const session = await requireAdmin();
    const receipts = await prisma.receipt.findMany({
      where: { orgId: session.user.orgId },
      include: {
        handover: { include: { vehicle: true } },
        receiver: true,
        accessoryAnswers: true,
        damages: true
      },
      orderBy: { submittedAt: 'desc' }
    });

    const rows: string[][] = [
      ['protocolo', 'data', 'placa', 'condutor', 'status', 'km', 'qtde_avarias', 'qtde_itens_faltando_danificado']
    ];

    receipts.forEach((receipt) => {
      const issues = receipt.accessoryAnswers.filter(
        (answer) => answer.value === 'FALTANDO' || answer.value === 'DANIFICADO'
      ).length;

      rows.push([
        receipt.protocol,
        receipt.submittedAt.toISOString(),
        receipt.handover.vehicle.plate,
        receipt.receiver.name,
        receipt.overallStatus,
        receipt.odometer.toString(),
        receipt.damages.length.toString(),
        issues.toString()
      ]);
    });

    const csv = toCsv(rows);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="receipts.csv"'
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }
}
