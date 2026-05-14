# HeatMatch

Anonymous 1-on-1 chat with filters for gender, university, age, and vibe. No accounts. No stored messages.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14, Tailwind CSS |
| Realtime | Socket.io |
| Queue | Redis |
| Backend | Node.js + Express |
| Database | PostgreSQL + Prisma |
| Types | Shared `@heatmatch/types` package |
| Monorepo | pnpm workspaces |

---

## Prerequisites

- **Node.js 18+** — https://nodejs.org
- **pnpm** — `npm install -g pnpm`
- **Redis** running locally
- **PostgreSQL** running locally

### Start services (Docker quickstart)

```bash
# Redis
docker run -d -p 6379:6379 redis

# PostgreSQL
docker run -d -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=heatmatch \
  postgres
```

---

## Setup

```bash
# 1. Unzip and enter the project
cd heatmatch

# 2. Make scripts executable
chmod +x install.sh dev.sh db-setup.sh

# 3. Install all dependencies + generate Prisma client
./install.sh

# 4. Run DB migrations + seed universities
./db-setup.sh

# 5. Start dev servers (client + server in parallel)
./dev.sh
```

- **Client** → http://localhost:3000
- **Server** → http://localhost:3001/health

---

## Environment Variables

### Server (apps/server/.env)

```
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/heatmatch
CLIENT_URL=http://localhost:3000
PORT=3001
```

### Client (apps/client/.env.local)

```
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

---

## Project Structure

```
heatmatch/
├── install.sh              # One-time setup
├── dev.sh                  # Start both servers
├── db-setup.sh             # Migrate + seed DB
├── apps/
│   ├── client/             # Next.js 14 frontend
│   │   ├── app/
│   │   │   ├── page.tsx            # Filter screen
│   │   │   ├── waiting/page.tsx    # Queue waiting screen
│   │   │   └── chat/page.tsx       # Chat screen
│   │   ├── components/
│   │   │   ├── ReportModal.tsx     # Report stranger modal
│   │   │   └── ConnectionBanner.tsx
│   │   ├── hooks/
│   │   │   ├── useSocket.ts
│   │   │   └── useUniversities.ts
│   │   ├── store/useAppStore.ts
│   │   └── lib/socket.ts
│   └── server/
│       ├── prisma/
│       │   ├── schema.prisma       # University + Report models
│       │   └── seed.ts             # PH universities
│       └── src/
│           ├── index.ts
│           ├── db/
│           │   ├── prisma.ts
│           │   ├── universities.ts
│           │   └── reports.ts
│           ├── routers/
│           │   ├── universities.ts # GET /universities
│           │   └── reports.ts      # POST /reports
│           ├── socket/handler.ts
│           └── matchmaking/
│               ├── queue.ts
│               ├── matcher.ts
│               └── relaxer.ts
└── packages/
    └── types/index.ts
```

---

## Features by Phase

| Phase | Status | Features |
|---|---|---|
| Phase 1 | Done | Matchmaking server, Redis queue, Socket.io, relaxation timer |
| Phase 2 | Done | Filter screen, waiting screen, chat screen, Zustand store |
| Phase 3 | Done | University DB, Report modal, Connection banner, Mobile polish |
| Phase 4 | Next | Deploy to Railway + Vercel |
