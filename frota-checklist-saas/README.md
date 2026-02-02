# Frota Checklist SaaS (MVP)

Checklist de recebimento de veículos em remanejamento (Modelo A). O admin cria o handover e o condutor recebedor preenche o receipt em formato wizard com pacote mínimo de 7 fotos.

## Stack
- Next.js (App Router) + TypeScript
- Tailwind CSS
- Postgres (Docker Compose)
- Prisma ORM
- NextAuth (Credentials)
- Zod para validações
- Upload local em `/uploads`

## Setup local

### 1) Subir banco de dados
```bash
docker compose up -d
```

### 2) Configurar variáveis de ambiente
Crie `.env` baseado em `.env.example`:
```bash
cp .env.example .env
```

### 3) Migrar banco e gerar client
```bash
npm install
npm run prisma:generate
npx prisma migrate dev --name init
```

### 4) Rodar seed
```bash
npm run prisma:seed
```

### 5) Rodar app
```bash
npm run dev
```

Acesse: `http://localhost:3000`

## Logins de teste
- **Admin**: admin@empresa.com / Admin#123
- **Driver 1**: driver1@empresa.com / Driver#123
- **Driver 2**: driver2@empresa.com / Driver#123

## Rotas principais
### Driver
- `/login`
- `/handover` (lista PENDING e COMPLETED)
- `/handover/[id]/receive` (wizard)
- `/handover/[id]` (recibo)

### Admin
- `/admin/vehicles`
- `/admin/handovers`
- `/admin/inspections` (export CSV)

## Upload de imagens
- Endpoint protegido: `POST /api/uploads`
- Armazena arquivos em `/uploads`
- Valida formato (jpg/png/webp) e tamanho máximo via `MAX_UPLOAD_MB`.

## Build
```bash
npm run build
```

## Checklist de entregáveis
- [x] Next.js + TypeScript + Tailwind
- [x] Docker Compose para Postgres
- [x] Prisma schema, migrations e seed
- [x] Autenticação (NextAuth Credentials)
- [x] Upload local com StorageService
- [x] Fluxo Driver (wizard com 7 fotos obrigatórias)
- [x] Fluxo Admin + export CSV
