# HeatChat — Setup Guide

## What you need

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 18 or higher | https://nodejs.org |
| pnpm | any | `npm install -g pnpm` |
| Docker | any | https://docs.docker.com/get-docker |

Docker is only needed for local development (it runs Redis for you).
In production, Redis is provided by Upstash — no Docker needed there.

---

## Development

### 1. Install dependencies

```bash
pnpm install
```

### 2. Create environment files

**Server** — copy the example then edit it:

```bash
cp apps/server/.env.example apps/server/.env
```

Open `apps/server/.env`. The defaults are fine for local dev — you only
need to change the two admin values at the bottom:

```env
REDIS_URL=redis://localhost:6379   # leave as-is, Docker Redis runs here
PORT=3001
CLIENT_URL=http://localhost:3000

ADMIN_SECRET=pick-a-password       # ← change this
ADMIN_JWT_SECRET=pick-32-chars-min # ← change this
```

**Client** — copy the example (no changes needed for dev):

```bash
cp apps/client/.env.example apps/client/.env.local
```

This sets `NEXT_PUBLIC_SOCKET_URL=http://localhost:3001` which points the
browser at your local server.

### 3. Start Redis

HeatChat uses Redis for the matchmaking queue. The easiest way locally is Docker:

```bash
docker run -d \
  --name heatchat-redis \
  -p 6379:6379 \
  redis:7
```

If you get a "permission denied" error on the Docker socket, either:

```bash
# Option A — add your user to the docker group (permanent, recommended)
sudo usermod -aG docker $USER
newgrp docker   # apply without logging out

# Option B — run docker with sudo
sudo docker run -d --name heatchat-redis -p 6379:6379 redis:7
```

To check Redis is running:

```bash
docker ps           # heatchat-redis should be listed
docker logs heatchat-redis   # should say "Ready to accept connections"
```

To stop Redis when you're done:

```bash
docker stop heatchat-redis
```

To start it again next time without re-creating:

```bash
docker start heatchat-redis
```

### 4. Start the dev servers

Open **two terminals** and run one command in each:

**Terminal 1 — server (Express + Socket.io):**
```bash
pnpm dev:server
```

**Terminal 2 — client (Next.js):**
```bash
pnpm dev:client
```

Then open **http://localhost:3000** in your browser.

The admin dashboard is at **http://localhost:3000/admin** — log in with
the `ADMIN_SECRET` you set in step 2.

---

## Production

### Redis

Create a free Redis database at **https://upstash.com**.
After creating it, copy the connection string — it looks like:

```
rediss://default:yourpassword@your-endpoint.upstash.io:6380
```

Note the `rediss://` (with double-s) — that means TLS, which Upstash requires.

### Environment variables

Set these on your hosting platform (Vercel, Railway, Render, etc.):

**Server:**

```env
REDIS_URL=rediss://default:yourpassword@your-endpoint.upstash.io:6380
PORT=3001
CLIENT_URL=https://yourdomain.com   # your actual frontend URL
ADMIN_SECRET=a-strong-password
ADMIN_JWT_SECRET=a-random-string-at-least-32-characters
```

**Client:**

```env
NEXT_PUBLIC_SOCKET_URL=https://your-server-domain.com
```

### Build

```bash
# Build the server
pnpm --filter server build

# Build the client
pnpm --filter client build
```

### Start

```bash
# Start the server
pnpm --filter server start

# Start the client
pnpm --filter client start
```

---

## Troubleshooting

**Port 3000 or 3001 already in use**
```bash
# Find what's using the port
lsof -i :3000
lsof -i :3001
# Kill it by PID
kill -9 <PID>
```

**Redis connection refused**
Make sure the Docker container is running:
```bash
docker start heatchat-redis
```
Or check that `REDIS_URL` in `apps/server/.env` matches where Redis is actually listening.

**pnpm: command not found**
```bash
npm install -g pnpm
```

**Changes not reflecting in the browser**
Both dev servers support hot reload — changes should appear automatically.
If they don't, restart the relevant server with Ctrl+C and re-run the command.
