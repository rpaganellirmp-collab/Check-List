import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Frota Checklist SaaS',
  description: 'Checklist de recebimento de veículos em remanejamento.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-50">
        <header className="border-b border-slate-200 bg-white">
          <div className="container-page flex items-center justify-between">
            <div>
              <Link href="/" className="text-lg font-semibold text-brand">
                Checklist de Recebimento
              </Link>
              <p className="text-xs text-slate-500">MVP SaaS • Remanejamento</p>
            </div>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/handover" className="text-slate-600 hover:text-slate-900">
                Handovers
              </Link>
              <Link href="/admin/handovers" className="text-slate-600 hover:text-slate-900">
                Admin
              </Link>
              <Link href="/login" className="text-slate-600 hover:text-slate-900">
                Login
              </Link>
            </nav>
          </div>
        </header>
        <main className="container-page">{children}</main>
      </body>
    </html>
  );
}
