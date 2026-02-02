import Link from 'next/link';

export default function Home() {
  return (
    <section className="space-y-6">
      <div className="card space-y-2">
        <h1 className="text-2xl font-semibold">Checklist de Recebimento - Modelo A</h1>
        <p className="text-slate-600">
          Fluxo mobile-first para remanejamento: admin cria handover e o condutor recebedor preenche o
          recebimento com fotos obrigatórias e apontamentos.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/login" className="rounded-md bg-brand px-4 py-2 text-white">
            Acessar
          </Link>
          <Link href="/handover" className="rounded-md border border-slate-200 px-4 py-2">
            Ver handovers
          </Link>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { title: 'Pacote mínimo de fotos', desc: '7 fotos obrigatórias com classificação por tipo.' },
          { title: 'Wizard guiado', desc: 'Etapas claras para acessórios, irregularidades e avarias.' },
          { title: 'Admin', desc: 'Cadastro de veículos, handovers e exportação CSV.' }
        ].map((item) => (
          <div key={item.title} className="card">
            <h2 className="text-lg font-semibold">{item.title}</h2>
            <p className="text-sm text-slate-600">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
