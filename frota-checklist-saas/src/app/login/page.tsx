'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false
    });

    setLoading(false);

    if (result?.error) {
      setError('Credenciais inválidas.');
      return;
    }

    router.push('/handover');
  }

  return (
    <div className="mx-auto max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold">Entrar</h1>
      <p className="text-sm text-slate-500">Use suas credenciais de condutor ou admin.</p>
      <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="text-sm font-medium">Email</label>
          <input
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">Senha</label>
          <input
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
        <button
          type="submit"
          className="w-full rounded-md bg-brand px-4 py-2 text-white disabled:opacity-70"
          disabled={loading}
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      <div className="mt-4 text-xs text-slate-500">
        <p>Admin: admin@empresa.com / Admin#123</p>
        <p>Drivers: driver1@empresa.com / Driver#123</p>
      </div>
    </div>
  );
}
