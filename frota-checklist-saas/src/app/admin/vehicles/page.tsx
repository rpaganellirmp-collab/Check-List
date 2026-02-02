'use client';

import { useEffect, useState } from 'react';

type Vehicle = {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year?: number | null;
};

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [form, setForm] = useState({ plate: '', brand: '', model: '', year: '' });
  const [error, setError] = useState('');

  async function loadVehicles() {
    const response = await fetch('/api/admin/vehicles');
    if (response.ok) {
      setVehicles(await response.json());
    }
  }

  useEffect(() => {
    loadVehicles();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const response = await fetch('/api/admin/vehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plate: form.plate,
        brand: form.brand,
        model: form.model,
        year: form.year ? Number(form.year) : undefined
      })
    });

    if (!response.ok) {
      setError('Falha ao criar veículo.');
      return;
    }

    setForm({ plate: '', brand: '', model: '', year: '' });
    loadVehicles();
  }

  return (
    <section className="space-y-4">
      <div className="card">
        <h1 className="text-xl font-semibold">Veículos</h1>
        <p className="text-sm text-slate-500">Cadastre e gerencie veículos da frota.</p>
      </div>

      <form className="card grid gap-3 md:grid-cols-4" onSubmit={handleSubmit}>
        <input
          className="rounded-md border border-slate-200 px-3 py-2"
          placeholder="Placa"
          value={form.plate}
          onChange={(event) => setForm({ ...form, plate: event.target.value })}
          required
        />
        <input
          className="rounded-md border border-slate-200 px-3 py-2"
          placeholder="Marca"
          value={form.brand}
          onChange={(event) => setForm({ ...form, brand: event.target.value })}
          required
        />
        <input
          className="rounded-md border border-slate-200 px-3 py-2"
          placeholder="Modelo"
          value={form.model}
          onChange={(event) => setForm({ ...form, model: event.target.value })}
          required
        />
        <input
          className="rounded-md border border-slate-200 px-3 py-2"
          placeholder="Ano"
          value={form.year}
          onChange={(event) => setForm({ ...form, year: event.target.value })}
        />
        <button className="rounded-md bg-brand px-4 py-2 text-white md:col-span-4" type="submit">
          Adicionar veículo
        </button>
        {error ? <p className="text-sm text-red-500 md:col-span-4">{error}</p> : null}
      </form>

      <div className="grid gap-3">
        {vehicles.map((vehicle) => (
          <div key={vehicle.id} className="card">
            <h2 className="font-semibold">
              {vehicle.brand} {vehicle.model} • {vehicle.plate}
            </h2>
            <p className="text-sm text-slate-500">Ano: {vehicle.year || '--'}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
