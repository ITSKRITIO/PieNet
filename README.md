# π PIE

**Made to be connected.**

A private social space for a small group — global chat that clears itself daily, shared plans,
announcements that stick around, and a permanent photo album. Built for about ten people, with
security and polish prioritised over scale.

- **Global Chat** — real-time messaging over Socket.IO. Every message is deleted 24 hours after it
  was sent.
- **Plans** — anyone can propose something; everyone can mark themselves going or maybe.
- **Announcements** — the things worth keeping, pinned by admins when they matter.
- **Memories** — albums and photos, resized and re-encoded on upload, kept forever.
- **Members** — searchable profiles with live online indicators and one shared π avatar.
- **Admin** — moderation for every content type plus a branding and appearance editor that writes to
  the database, so the look changes without touching code.

---

## Requirements

- **Node.js 18.18 or newer** (20 LTS recommended) — <https://nodejs.org>
- **MySQL 8.0 or newer** — <https://dev.mysql.com/downloads/installer/> (MariaDB 10.6+ also works)
- Windows, macOS or Linux. The instructions below use Windows paths where it matters.

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create the database

Open MySQL Command Line Client (or MySQL Workbench) and run:

```sql
CREATE DATABASE pie CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'pie_user'@'localhost' IDENTIFIED BY 'your-password-here';
GRANT ALL PRIVILEGES ON pie.* TO 'pie_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Create your `.env`

Copy the example and fill it in:

```bash
copy .env.example .env      # Windows
cp .env.example .env        # macOS / Linux
```

Generate a session secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Generate the admin code hash (you'll be prompted for the code you want to use):

```bash
npm run admin:hash
```

Paste the printed `ADMIN_CODE_HASH_B64=...` line into `.env`. The plain code is never stored
anywhere — only its bcrypt hash, and only on the server.

### 4. Create the tables

```bash
npm run db:migrate
```

Prisma will ask for a migration name the first time; `init` is fine.

### 5. (Optional) Add sample data

```bash
npm run db:seed
```

This creates four test accounts (`alice`, `bob`, `carol`, `dave`) with the password printed in the
output, plus example plans, announcements, chat messages and a photo album. It only runs when you
ask for it, never automatically.

### 6. Start it

```bash
npm run dev
```

Open <http://localhost:3000>, create your account, then sign in again with your admin code in the
**Admin code** field to unlock the admin dashboard.

---

## Environment variables

| Variable | Required | What it does |
| --- | --- | --- |
| `DATABASE_URL` | yes | MySQL connection string. URL-encode special characters in the password (`@` → `%40`). |
| `SESSION_SECRET` | yes | At least 32 random characters. Used to HMAC session tokens before storing them. Changing it signs everyone out. |
| `SESSION_DAYS` | no | How long a session lasts. Defaults to 7. |
| `ADMIN_CODE_HASH_B64` | for admin | Base64 of a bcrypt hash of your admin code. Generate with `npm run admin:hash`. Without it, admin sign-in is disabled. |
| `INVITE_CODE` | no | When set, new accounts must supply this code. Recommended if the site is reachable from the internet. |
| `STORAGE_DIR` | no | Where photos are written. Defaults to `./storage`. |
| `MAX_UPLOAD_MB` | no | Per-file upload limit. Defaults to 10. |
| `PORT` / `HOST` | no | Defaults to 3000 and `0.0.0.0`. |
| `TRUST_PROXY` | no | Set `true` only behind a reverse proxy you control, so `X-Forwarded-For` can be trusted for rate limiting. |
| `COOKIE_SECURE` | no | Defaults to true in production. Set `false` if you serve production over plain HTTP. |

`.env` is git-ignored. Never commit real secrets; commit `.env.example` instead.

---

## Admin access

Admin rights are **per session**, not per account. On the sign-in page, click *I have an admin code*
and enter the code alongside your normal username and password. That session is then an admin
session; signing in without the code gives you an ordinary member session.

The code never reaches the browser and never appears in the source. It's verified server-side
against a bcrypt hash, and every admin endpoint re-checks the session's admin flag on the server —
a member can't gain admin powers by editing requests in devtools.

To change the code: run `npm run admin:hash` again, replace the line in `.env`, and restart.

---

## How the 24-hour chat cleanup works

Two things keep chat temporary, so nothing slips through:

1. **A scheduled job** (`src/server/jobs.ts`) runs at startup and every five minutes, deleting rows
   from `messages` where `createdAt` is older than 24 hours. The `messages.createdAt` index makes
   this cheap.
2. **Every read is filtered** by the same cutoff, so even a message that hasn't been swept yet is
   never shown.

The job touches only the `messages` table. Profiles, plans, announcements, albums and photos are
permanent.

---

## Project layout

```
server.ts                  Custom HTTP server: Next.js + Socket.IO + the cleanup scheduler
prisma/schema.prisma       Database schema
prisma/seed.ts             Development seed data
scripts/hash-admin-code.ts Generates the admin code hash
src/middleware.ts          Optimistic redirect to /login when no session cookie is present
src/app/(auth)/            Login and signup, shown only when signed out
src/app/(app)/             Everything behind authentication
src/app/(app)/admin/       Admin dashboard
src/app/api/               Route handlers (auth, members, messages, plans, albums, media, admin)
src/components/            Shared UI; components/admin/ for the dashboard
src/lib/                   auth, session, password, validation, storage, settings, rate limiting
src/server/                Socket.IO server and background jobs
```

---

## Security notes

- Passwords are hashed with bcrypt (cost 12) and never stored or logged in plain text. Unknown
  usernames still run a bcrypt comparison so timing doesn't reveal which accounts exist.
- Session tokens are 32 random bytes. Only an HMAC of the token is stored, so database access alone
  can't be used to hijack a session. The cookie is `HttpOnly`, `SameSite=Lax` and `Secure` in
  production.
- Every API route validates its input with Zod and re-checks authorisation server-side. Ownership
  checks (your own message, your own plan, your own photo) happen on the server, with admins as the
  only override.
- State-changing requests require a same-origin `Origin`/`Sec-Fetch-Site`, which blocks CSRF. The
  WebSocket connection checks `Origin` the same way and requires a valid session cookie.
- Rate limits cover sign-in (per IP and per username, failures only), sign-up, chat, plan creation,
  password changes and uploads.
- Uploads are checked by MIME type *and* by decoding the image, then re-encoded to WebP with
  metadata stripped. Filenames are server-generated hex IDs and every path is verified to stay inside
  the storage directory, so directory traversal isn't possible. Photos are served only to signed-in
  members.
- React escapes all user content by default; there is no `dangerouslySetInnerHTML` on user data. A
  strict Content-Security-Policy is set in `next.config.mjs`.

---

## Production build

```bash
npm run build
npm run db:deploy
npm start
```

Run it behind a reverse proxy (nginx, Caddy, IIS) terminating HTTPS, and set `TRUST_PROXY=true` so
rate limiting sees real client IPs. Make sure the proxy forwards WebSocket upgrades to `/socket.io`
— in nginx that means `proxy_set_header Upgrade $http_upgrade;` and `proxy_set_header Connection "upgrade";`.

Back up two things: the MySQL database and the `storage/` directory. Photos live on disk, not in the
database, so one without the other is incomplete.

Because presence and rate limiting are held in process memory, run a single instance. That's the
right shape for a ten-person site; scaling out would need a Redis adapter for Socket.IO.

---

## Troubleshooting

**`SESSION_SECRET must be set to at least 32 characters`** — generate one with the command in step 3.

**`Can't reach database server`** — MySQL isn't running, or `DATABASE_URL` is wrong. Check the
service in Windows Services, and URL-encode special characters in the password.

**Admin code doesn't work** — confirm `ADMIN_CODE_HASH_B64` is in `.env` and restart the server.
Admin > Settings shows whether a code is configured.

**Chat says "Connection lost"** — the custom server isn't running (`npm run dev`, not `next dev`),
or a proxy in front of it isn't forwarding WebSocket upgrades.

**Uploads fail** — check the file is under `MAX_UPLOAD_MB` and is a JPG, PNG, WebP or GIF. If sharp
fails to install on Windows, run `npm rebuild sharp`.
