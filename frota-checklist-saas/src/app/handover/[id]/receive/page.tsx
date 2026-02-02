import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ReceiptWizard } from '@/components/ReceiptWizard';
import Link from 'next/link';

export default async function ReceiveHandoverPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return (
      <div className="card">
        <p className="text-sm text-slate-500">Faça login para acessar.</p>
        <Link href="/login" className="mt-3 inline-flex rounded-md bg-brand px-4 py-2 text-white">
          Login
        </Link>
      </div>
    );
  }

  const handover = await prisma.handover.findFirst({
    where: { id: params.id, orgId: session.user.orgId },
    include: { vehicle: true }
  });

  if (!handover) {
    return <div className="card">Handover não encontrado.</div>;
  }

  if (session.user.role !== 'DRIVER' || handover.toUserId !== session.user.id) {
    return <div className="card">Você não tem permissão para este handover.</div>;
  }

  const accessories = await prisma.accessoryTemplateItem.findMany({
    where: { orgId: session.user.orgId },
    orderBy: { createdAt: 'asc' }
  });

  const quickChecks = await prisma.quickCheckItem.findMany({
    where: { orgId: session.user.orgId },
    orderBy: { createdAt: 'asc' }
  });

  return (
    <section className="space-y-4">
      <div className="card">
        <h1 className="text-xl font-semibold">Receber veículo</h1>
        <p className="text-sm text-slate-500">
          {handover.vehicle.brand} {handover.vehicle.model} • {handover.vehicle.plate}
        </p>
      </div>
      <ReceiptWizard handoverId={handover.id} accessories={accessories} quickChecks={quickChecks} />
    </section>
  );
}
