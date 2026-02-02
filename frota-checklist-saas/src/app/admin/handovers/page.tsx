'use client';

import { useEffect, useState } from 'react';

type Vehicle = { id: string; plate: string; brand: string; model: string };

type User = { id: string; name: string; email: string; role: string };

type Handover = {
  id: string;
  status: string;
  createdAt: string;
  vehicle: Vehicle;
  toUser: User;
};

export default function HandoversAdminPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<User[]>([]);
  const [handovers, setHandovers] = useState<Handover[]>([]);
  const [form, setForm] = useState({ vehicleId: '', toUserId: '' });
  const [error, setError] = useState('');

  async function loadData() {
    const [vehiclesRes, usersRes, handoversRes] = await Promise.all([
      fetch('/api/admin/vehicles'),
      fetch('/api/admin/users'),
      fetch('/api/admin/handovers')
    ]);

    if (vehiclesRes.ok) setVehicles(await vehiclesRes.json());
    if (usersRes.ok) {
      const users = await usersRes.json();
      setDrivers(users.filter((user: User) => user.role === 'DRIVER'));
    }
    if (handoversRes.ok) setHandovers(await handoversRes.json());
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const response = await fetch('/api/admin/handovers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });

    if (!response.ok) {
      setError('Falha ao criar handover.');
      return;
    }

    setForm({ vehicleId: '', toUserId: '' });
    loadData();
  }

  return (
    <section className="space-y-4">
      <div className="card">
        <h1 className="text-xl font-semibold">Handovers</h1>
        <p className="text-sm text-slate-500">Crie e acompanhe remanejamentos.</p>
      </div>

      <form className="card space-y-3" onSubmit={handleSubmit}>
        <div className="grid gap-3 md:grid-cols-2">
          <select
            className="rounded-md border border-slate-200 px-3 py-2"
            value={form.vehicleId}
            onChange={(event) => setForm({ ...form, vehicleId: event.target.value })}
            required
          >
            <option value="">Selecione o veículo</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.plate} • {vehicle.brand} {vehicle.model}
              </option>
            ))}
          </select>
          <select
            className="rounded-md border border-slate-200 px-3 py-2"
            value={form.toUserId}
            onChange={(event) => setForm({ ...form, toUserId: event.target.value })}
            required
          >
            <option value="">Selecione o condutor</option>
            {drivers.map((driver) => (
              <option key={driver.id} value={driver.id}>
                {driver.name} ({driver.email})
              </option>
            ))}
          </select>
        </div>
        <button className="rounded-md bg-brand px-4 py-2 text-white" type="submit">
          Criar handover
        </button>
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
      </form>

      <div className="grid gap-3">
        {handovers.map((handover) => (
          <div key={handover.id} className="card">
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-semibold">
                  {handover.vehicle.plate} • {handover.vehicle.brand} {handover.vehicle.model}
                </h2>
                <p className="text-sm text-slate-500">Para: {handover.toUser.name}</p>
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
          </div>
        ))}
      </div>
    </section>
  );
}
