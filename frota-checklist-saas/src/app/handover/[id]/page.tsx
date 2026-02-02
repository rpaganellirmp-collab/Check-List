import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';

export default async function HandoverDetailPage({ params }: { params: { id: string } }) {
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
    where:
      session.user.role === 'ADMIN'
        ? { id: params.id, orgId: session.user.orgId }
        : { id: params.id, orgId: session.user.orgId, toUserId: session.user.id },
    include: {
      vehicle: true,
      receipt: {
        include: {
          accessoryAnswers: { include: { item: true } },
          quickCheckAnswers: { include: { item: true } },
          damages: true,
          attachments: true
        }
      }
    }
  });

  if (!handover || !handover.receipt) {
    return <div className="card">Recibo não encontrado.</div>;
  }

  const receipt = handover.receipt;

  return (
    <section className="space-y-4">
      <div className="card">
        <h1 className="text-xl font-semibold">Recibo {receipt.protocol}</h1>
        <p className="text-sm text-slate-500">
          {handover.vehicle.brand} {handover.vehicle.model} • {handover.vehicle.plate}
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <span className="badge bg-slate-100 text-slate-600">{receipt.overallStatus}</span>
          <span className="badge bg-slate-100 text-slate-600">KM: {receipt.odometer}</span>
          <span className="badge bg-slate-100 text-slate-600">
            Fotos anexadas: {receipt.attachments.length}
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <h2 className="font-semibold">Acessórios</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {receipt.accessoryAnswers.map((answer) => (
              <li key={answer.id} className="flex items-center justify-between">
                <span>{answer.item.name}</span>
                <span className="badge bg-slate-100 text-slate-600">{answer.value}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h2 className="font-semibold">Irregularidades rápidas</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {receipt.quickCheckAnswers.map((answer) => (
              <li key={answer.id} className="flex items-center justify-between">
                <span>{answer.item.name}</span>
                <span className="badge bg-slate-100 text-slate-600">{answer.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold">Avarias</h2>
        {receipt.damages.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma avaria registrada.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm">
            {receipt.damages.map((damage) => (
              <li key={damage.id}>
                <strong>{damage.type}</strong> • {damage.location} • {damage.severity}
                <p className="text-xs text-slate-500">{damage.notes}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
