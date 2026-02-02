'use client';

import { useMemo, useState } from 'react';
import type { BasePhotoType, DamageLocation, DamageSeverity, DamageType } from '@prisma/client';

const basePhotoSteps: { type: BasePhotoType; label: string; hint: string }[] = [
  { type: 'ODOMETRO', label: 'Foto do painel/odômetro', hint: 'Certifique-se de que o KM esteja legível.' },
  { type: 'FRENTE', label: 'Foto da frente', hint: 'Pegue o veículo inteiro de frente.' },
  { type: 'TRASEIRA', label: 'Foto da traseira', hint: 'Pegue o veículo inteiro de trás.' },
  { type: 'LATERAL_ESQ', label: 'Foto da lateral esquerda', hint: 'Inclua rodas e lataria.' },
  { type: 'LATERAL_DIR', label: 'Foto da lateral direita', hint: 'Inclua rodas e lataria.' },
  { type: 'INTERIOR', label: 'Foto do interior', hint: 'Bancos + painel geral.' },
  {
    type: 'AREA_CRITICA',
    label: 'Foto da área crítica',
    hint: 'Pickup: caçamba/para-choque traseiro em close. Outros: para-choque dianteiro em close.'
  }
];

const damageTypes: DamageType[] = [
  'RISCO',
  'AMASSADO',
  'TRINCA',
  'QUEBRA',
  'FALTA_PECA',
  'DESALINHAMENTO',
  'OUTRO'
];

const damageSeverities: DamageSeverity[] = ['LEVE', 'MODERADA', 'GRAVE'];

const damageLocations: DamageLocation[] = [
  'PARA_CHOQUE_DIANTEIRO',
  'PARA_CHOQUE_TRASEIRO',
  'CAPO',
  'TETO',
  'PARA_LAMA_ESQ',
  'PARA_LAMA_DIR',
  'PORTA_DIANTEIRA_ESQ',
  'PORTA_DIANTEIRA_DIR',
  'PORTA_TRASEIRA_ESQ',
  'PORTA_TRASEIRA_DIR',
  'LATERAL_ESQ',
  'LATERAL_DIR',
  'VIDRO_DIANTEIRO',
  'VIDRO_TRASEIRO',
  'FAROL_ESQ',
  'FAROL_DIR',
  'LANTERNA_ESQ',
  'LANTERNA_DIR',
  'RODA_PNEU',
  'INTERIOR',
  'OUTRO'
];

type AccessoryItem = { id: string; name: string; isOptional: boolean };

type QuickCheckItem = { id: string; name: string };

type UploadResult = { filePath: string; mimeType: string };

async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch('/api/uploads', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const payload = await response.json();
    throw new Error(payload.error || 'Falha no upload');
  }

  return (await response.json()) as UploadResult;
}

export function ReceiptWizard({
  handoverId,
  accessories,
  quickChecks
}: {
  handoverId: string;
  accessories: AccessoryItem[];
  quickChecks: QuickCheckItem[];
}) {
  const [step, setStep] = useState(1);
  const [odometer, setOdometer] = useState('');
  const [fuelLevel, setFuelLevel] = useState('');
  const [basePhotos, setBasePhotos] = useState<Record<BasePhotoType, UploadResult | null>>({
    ODOMETRO: null,
    FRENTE: null,
    TRASEIRA: null,
    LATERAL_ESQ: null,
    LATERAL_DIR: null,
    INTERIOR: null,
    AREA_CRITICA: null
  });
  const [accessoryAnswers, setAccessoryAnswers] = useState<Record<string, { value: string; notes: string; file?: UploadResult }>>({});
  const [quickAnswers, setQuickAnswers] = useState<Record<string, { value: string; notes: string; file?: UploadResult }>>({});
  const [damages, setDamages] = useState<
    { type: DamageType; location: DamageLocation; severity: DamageSeverity; notes: string; file?: UploadResult }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const basePhotosCompleted = useMemo(
    () => Object.values(basePhotos).every((photo) => photo !== null),
    [basePhotos]
  );

  const missingAccessories = useMemo(
    () =>
      accessories.filter((item) => {
        const answer = accessoryAnswers[item.id];
        if (!answer) return true;
        if (['FALTANDO', 'DANIFICADO'].includes(answer.value)) {
          return !answer.notes || !answer.file;
        }
        return false;
      }),
    [accessories, accessoryAnswers]
  );

  async function handleBaseUpload(type: BasePhotoType, file: File) {
    setError('');
    const stored = await uploadFile(file);
    setBasePhotos((prev) => ({ ...prev, [type]: stored }));
  }

  async function handleAccessoryUpload(id: string, file: File) {
    const stored = await uploadFile(file);
    setAccessoryAnswers((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || { value: 'OK', notes: '' }), file: stored }
    }));
  }

  async function handleQuickUpload(id: string, file: File) {
    const stored = await uploadFile(file);
    setQuickAnswers((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || { value: 'OK', notes: '' }), file: stored }
    }));
  }

  async function handleDamageUpload(index: number, file: File) {
    const stored = await uploadFile(file);
    setDamages((prev) => prev.map((item, idx) => (idx === index ? { ...item, file: stored } : item)));
  }

  async function handleSubmit() {
    setError('');
    setSuccess('');
    if (!basePhotosCompleted) {
      setError('Complete o pacote mínimo de fotos antes de enviar.');
      return;
    }

    if (missingAccessories.length > 0) {
      setError('Complete os acessórios obrigatórios com comentário e foto.');
      return;
    }

    if (!odometer) {
      setError('Informe o odômetro.');
      return;
    }

    let payload;
    try {
      const basePhotoPayload = Object.entries(basePhotos).map(([type, photo]) => {
        if (!photo) {
          throw new Error('Pacote mínimo de fotos incompleto.');
        }
        return { basePhotoType: type, filePath: photo.filePath, mimeType: photo.mimeType };
      });

      payload = {
        handoverId,
        odometer: Number(odometer),
        fuelLevel: fuelLevel || undefined,
        basePhotos: basePhotoPayload,
        accessories: accessories.map((item) => ({
          itemId: item.id,
          value: accessoryAnswers[item.id]?.value || 'OK',
          notes: accessoryAnswers[item.id]?.notes || undefined,
          attachments: accessoryAnswers[item.id]?.file
            ? [
                {
                  filePath: accessoryAnswers[item.id]?.file?.filePath,
                  mimeType: accessoryAnswers[item.id]?.file?.mimeType
                }
              ]
            : []
        })),
        quickChecks: quickChecks.map((item) => ({
          itemId: item.id,
          value: quickAnswers[item.id]?.value || 'OK',
          notes: quickAnswers[item.id]?.notes || undefined,
          attachments: quickAnswers[item.id]?.file
            ? [
                {
                  filePath: quickAnswers[item.id]?.file?.filePath,
                  mimeType: quickAnswers[item.id]?.file?.mimeType
                }
              ]
            : []
        })),
        damages: damages.map((damage) => ({
          type: damage.type,
          location: damage.location,
          severity: damage.severity,
          notes: damage.notes,
          attachments: damage.file
            ? [{ filePath: damage.file.filePath, mimeType: damage.file.mimeType }]
            : []
        }))
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao preparar envio.');
      return;
    }

    setLoading(true);
    const response = await fetch(`/api/handovers/${handoverId}/receive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    setLoading(false);

    if (!response.ok) {
      const data = await response.json();
      setError(data.error || 'Falha ao enviar recebimento.');
      return;
    }

    setSuccess('Recebimento enviado com sucesso.');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Etapa {step} de 5</h2>
        <div className="text-sm text-slate-500">Pacote mínimo: {basePhotosCompleted ? 'OK' : 'Pendente'}</div>
      </div>

      {step === 1 ? (
        <div className="space-y-4">
          <div className="card space-y-3">
            <h3 className="text-lg font-semibold">Dados e fotos obrigatórias</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Odômetro (km)</label>
                <input
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
                  type="number"
                  min={0}
                  value={odometer}
                  onChange={(event) => setOdometer(event.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Nível de combustível (opcional)</label>
                <input
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
                  placeholder="Ex.: 1/2 tanque"
                  value={fuelLevel}
                  onChange={(event) => setFuelLevel(event.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {basePhotoSteps.map((item) => (
              <div key={item.type} className="card space-y-2">
                <div>
                  <h4 className="font-semibold">{item.label}</h4>
                  <p className="text-xs text-slate-500">{item.hint}</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      handleBaseUpload(item.type, file).catch((err) => setError(err.message));
                    }
                  }}
                />
                {basePhotos[item.type] ? (
                  <p className="text-xs text-emerald-600">Foto anexada.</p>
                ) : (
                  <p className="text-xs text-amber-600">Obrigatório</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Acessórios</h3>
          {accessories.map((item) => {
            const answer = accessoryAnswers[item.id] || { value: 'OK', notes: '' };
            return (
              <div key={item.id} className="card space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">{item.name}</h4>
                  {item.isOptional ? (
                    <span className="badge bg-slate-100 text-slate-600">Opcional</span>
                  ) : null}
                </div>
                <select
                  className="w-full rounded-md border border-slate-200 px-3 py-2"
                  value={answer.value}
                  onChange={(event) =>
                    setAccessoryAnswers((prev) => ({
                      ...prev,
                      [item.id]: { ...answer, value: event.target.value }
                    }))
                  }
                >
                  <option value="OK">OK</option>
                  <option value="FALTANDO">FALTANDO</option>
                  <option value="DANIFICADO">DANIFICADO</option>
                  <option value="NA">N/A</option>
                </select>
                {['FALTANDO', 'DANIFICADO'].includes(answer.value) ? (
                  <div className="space-y-2">
                    <textarea
                      className="w-full rounded-md border border-slate-200 px-3 py-2"
                      placeholder="Descreva o problema"
                      value={answer.notes}
                      onChange={(event) =>
                        setAccessoryAnswers((prev) => ({
                          ...prev,
                          [item.id]: { ...answer, notes: event.target.value }
                        }))
                      }
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          handleAccessoryUpload(item.id, file).catch((err) => setError(err.message));
                        }
                      }}
                    />
                    {answer.file ? <p className="text-xs text-emerald-600">Foto anexada.</p> : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Irregularidades rápidas</h3>
          {quickChecks.map((item) => {
            const answer = quickAnswers[item.id] || { value: 'OK', notes: '' };
            return (
              <div key={item.id} className="card space-y-3">
                <h4 className="font-semibold">{item.name}</h4>
                <select
                  className="w-full rounded-md border border-slate-200 px-3 py-2"
                  value={answer.value}
                  onChange={(event) =>
                    setQuickAnswers((prev) => ({
                      ...prev,
                      [item.id]: { ...answer, value: event.target.value }
                    }))
                  }
                >
                  <option value="OK">OK</option>
                  <option value="IRREGULAR">IRREGULAR</option>
                  <option value="NA">N/A</option>
                </select>
                {answer.value === 'IRREGULAR' ? (
                  <div className="space-y-2">
                    <textarea
                      className="w-full rounded-md border border-slate-200 px-3 py-2"
                      placeholder="Descreva a irregularidade"
                      value={answer.notes}
                      onChange={(event) =>
                        setQuickAnswers((prev) => ({
                          ...prev,
                          [item.id]: { ...answer, notes: event.target.value }
                        }))
                      }
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          handleQuickUpload(item.id, file).catch((err) => setError(err.message));
                        }
                      }}
                    />
                    {answer.file ? <p className="text-xs text-emerald-600">Foto anexada.</p> : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      {step === 4 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Avarias</h3>
            <button
              type="button"
              className="rounded-md border border-slate-200 px-3 py-2 text-sm"
              onClick={() =>
                setDamages((prev) => [
                  ...prev,
                  { type: 'RISCO', location: 'OUTRO', severity: 'LEVE', notes: '' }
                ])
              }
            >
              Adicionar avaria
            </button>
          </div>
          {damages.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhuma avaria registrada.</p>
          ) : null}
          {damages.map((damage, index) => (
            <div key={`${damage.type}-${index}`} className="card space-y-3">
              <div className="grid gap-3 md:grid-cols-3">
                <select
                  className="rounded-md border border-slate-200 px-3 py-2"
                  value={damage.type}
                  onChange={(event) =>
                    setDamages((prev) =>
                      prev.map((item, idx) =>
                        idx === index ? { ...item, type: event.target.value as DamageType } : item
                      )
                    )
                  }
                >
                  {damageTypes.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <select
                  className="rounded-md border border-slate-200 px-3 py-2"
                  value={damage.location}
                  onChange={(event) =>
                    setDamages((prev) =>
                      prev.map((item, idx) =>
                        idx === index ? { ...item, location: event.target.value as DamageLocation } : item
                      )
                    )
                  }
                >
                  {damageLocations.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <select
                  className="rounded-md border border-slate-200 px-3 py-2"
                  value={damage.severity}
                  onChange={(event) =>
                    setDamages((prev) =>
                      prev.map((item, idx) =>
                        idx === index ? { ...item, severity: event.target.value as DamageSeverity } : item
                      )
                    )
                  }
                >
                  {damageSeverities.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                className="w-full rounded-md border border-slate-200 px-3 py-2"
                placeholder="Descreva a avaria"
                value={damage.notes}
                onChange={(event) =>
                  setDamages((prev) =>
                    prev.map((item, idx) => (idx === index ? { ...item, notes: event.target.value } : item))
                  )
                }
              />
              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    handleDamageUpload(index, file).catch((err) => setError(err.message));
                  }
                }}
              />
              {damage.file ? <p className="text-xs text-emerald-600">Foto anexada.</p> : null}
            </div>
          ))}
        </div>
      ) : null}

      {step === 5 ? (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Revisão</h3>
          <div className="card space-y-2">
            <p className="text-sm">
              <strong>Odômetro:</strong> {odometer || '--'}
            </p>
            <p className="text-sm">
              <strong>Combustível:</strong> {fuelLevel || '--'}
            </p>
            <p className="text-sm">
              <strong>Pacote mínimo de fotos:</strong> {basePhotosCompleted ? 'OK' : 'Pendente'}
            </p>
            <p className="text-sm">
              <strong>Acessórios pendentes:</strong> {missingAccessories.length}
            </p>
            <p className="text-sm">
              <strong>Avarias registradas:</strong> {damages.length}
            </p>
          </div>
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-600">{success}</p> : null}

      <div className="flex items-center justify-between">
        <button
          type="button"
          className="rounded-md border border-slate-200 px-4 py-2"
          onClick={() => setStep((prev) => Math.max(1, prev - 1))}
          disabled={step === 1}
        >
          Voltar
        </button>
        {step < 5 ? (
          <button
            type="button"
            className="rounded-md bg-brand px-4 py-2 text-white"
            onClick={() => {
              if (step === 1 && (!basePhotosCompleted || !odometer)) {
                setError('Complete odômetro e fotos obrigatórias antes de avançar.');
                return;
              }
              if (step === 2 && missingAccessories.length > 0) {
                setError('Complete os acessórios obrigatórios antes de avançar.');
                return;
              }
              setError('');
              setStep((prev) => Math.min(5, prev + 1));
            }}
          >
            Avançar
          </button>
        ) : (
          <button
            type="button"
            className="rounded-md bg-brand px-4 py-2 text-white disabled:opacity-70"
            onClick={() => handleSubmit()}
            disabled={loading}
          >
            {loading ? 'Enviando...' : 'Enviar recebimento'}
          </button>
        )}
      </div>
    </div>
  );
}
