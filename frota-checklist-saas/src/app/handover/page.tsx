import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function HandoverPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return (
      <div className="card">
        <h1 className="text-xl font-semibold">Faça login</h1>
        <p className="text-slate-600">Você precisa estar autenticado para ver os handovers.</p>
        <Link href="/login" className="mt-3 inline-flex rounded-md bg-brand px-4 py-2 text-white">
          Login
        </Link>
      </div>
    );
  }

  const handovers = await prisma.handover.findMany({
    where:
      session.user.role === 'ADMIN'
        ? { orgId: session.user.orgId }
        : { orgId: session.user.orgId, toUserId: session.user.id },
    include: { vehicle: true, receipt: true },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Handovers</h1>
          <p className="text-sm text-slate-500">Pendentes e histórico de recebimentos.</p>
        </div>
        {session.user.role === 'ADMIN' ? (
          <Link href="/admin/handovers" className="rounded-md border border-slate-200 px-4 py-2">
            Gerenciar handovers
          </Link>
        ) : null}
      </div>

      <div className="grid gap-4">
        {handovers.map((handover) => (
          <div key={handover.id} className="card">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  {handover.vehicle.brand} {handover.vehicle.model} • {handover.vehicle.plate}
                </h2>
                <p className="text-sm text-slate-500">Criado em {handover.createdAt.toLocaleString()}</p>
              </div>
              <span
                className={`badge ${
                  handover.status === 'PENDING'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {handover.status}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              {handover.status === 'PENDING' && session.user.role === 'DRIVER' ? (
                <Link
                  href={`/handover/${handover.id}/receive`}
                  className="rounded-md bg-brand px-4 py-2 text-white"
                >
                  Receber veículo
                </Link>
              ) : null}
              {handover.receipt ? (
                <Link
                  href={`/handover/${handover.id}`}
                  className="rounded-md border border-slate-200 px-4 py-2"
                >
                  Ver recibo
                </Link>
              ) : null}
            </div>
          </div>
        ))}
        {handovers.length === 0 ? (
          <div className="card">
            <p className="text-sm text-slate-500">Nenhum handover encontrado.</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
