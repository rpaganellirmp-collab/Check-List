'use client';

import { useEffect, useState } from 'react';

type Receipt = {
  id: string;
  protocol: string;
  submittedAt: string;
  overallStatus: string;
  odometer: number;
  handover: { vehicle: { plate: string } };
  receiver: { name: string };
  damages: { id: string }[];
  accessoryAnswers: { value: string }[];
};

export default function InspectionsPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);

  async function loadReceipts() {
    const response = await fetch('/api/admin/inspections');
    if (response.ok) {
      setReceipts(await response.json());
    }
  }

  useEffect(() => {
    loadReceipts();
  }, []);

  return (
    <section className="space-y-4">
      <div className="card flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Receipts</h1>
          <p className="text-sm text-slate-500">Acompanhe recebimentos e exporte CSV.</p>
        </div>
        <a
          className="rounded-md border border-slate-200 px-4 py-2 text-sm"
          href="/api/admin/inspections/export"
        >
          Exportar CSV
        </a>
      </div>

      <div className="grid gap-3">
        {receipts.map((receipt) => {
          const issues = receipt.accessoryAnswers.filter(
            (answer) => answer.value === 'FALTANDO' || answer.value === 'DANIFICADO'
          ).length;
          return (
            <div key={receipt.id} className="card">
              <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="font-semibold">
                    {receipt.protocol} • {receipt.handover.vehicle.plate}
                  </h2>
                  <p className="text-sm text-slate-500">Condutor: {receipt.receiver.name}</p>
                </div>
                <span className="badge bg-slate-100 text-slate-600">{receipt.overallStatus}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                <span>KM: {receipt.odometer}</span>
                <span>Avarias: {receipt.damages.length}</span>
                <span>Itens faltando/danificado: {issues}</span>
                <span>Data: {new Date(receipt.submittedAt).toLocaleString()}</span>
              </div>
            </div>
          );
        })}
        {receipts.length === 0 ? (
          <div className="card">
            <p className="text-sm text-slate-500">Nenhum recebimento registrado.</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
