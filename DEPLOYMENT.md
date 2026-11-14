# Deploying SmartBid Solutions to smartbidsolutions.in

There are two free hosting options. Pick one.

| | Plan A: Oracle Cloud server | Plan B: managed free services |
|---|---|---|
| Domain + DNS | your registrar | Cloudflare |
| Frontend | nginx on the VM | Cloudflare Pages |
| API | Node + pm2 on the VM | Render (free web service) |
| Database | PostgreSQL on the VM | Supabase |
| Uploads | `backend/uploads` on disk | Cloudinary |
| Daily tender sync | built-in cron | GitHub Actions calls the API |
| Upkeep | you patch the VM and take backups | the providers handle it; the API sleeps when idle (~1 min cold start) |

> ⚠️ **Before going live:** `prisma/seed.js` creates `admin@smartbidsolutions.in / Admin@123` and `demo@example.com / Demo@1234`.
> Log in and change both passwords right after seeding (or delete the demo user). Set a fresh random `JWT_SECRET`;
> never use the value from `.env.example`. A quick way to make one: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.

Every new environment variable is optional. Leave one unset and the app behaves the same as in local dev.

| Variable | Effect when set |
|---|---|
| `TRUST_PROXY` | Express `trust proxy` (use `1` behind nginx or Render), so rate limiting sees real client IPs |
| `CRON_TZ` | Timezone for the daily 06:00 sync, e.g. `Asia/Kolkata`. Unset = server time (UTC on most hosts) |
| `DISABLE_INTERNAL_CRON=true` | Turns off the built-in cron (for hosts that sleep) |
| `CRON_SECRET` | Enables `POST /api/internal/sync-tenders`, which requires the header `x-cron-secret`. Unset = 404 |
| `PORTAL_PROXY_URL` + `PORTAL_PROXY_SECRET` | Tender sync reaches GeM/nProcure through the Supabase Edge Function `portal-proxy` (Mumbai). Needed when the API runs outside India, because both portals block foreign IPs. See "Tender portal proxy" below |
| `CLOUDINARY_URL` (or `CLOUDINARY_CLOUD_NAME` + `CLOUDINARY_API_KEY` + `CLOUDINARY_API_SECRET`) | `POST /api/admin/upload` stores files on Cloudinary and returns an absolute `https://` URL |

`POST /api/internal/sync-tenders` runs the sync synchronously and returns the same JSON as the sync itself (`{ success, synced, created, updated, closed, skipped, total, sources }`).
If a sync is already running, it returns `409`. Uptime monitors should ping `GET /health` (no DB call, no auth, no rate limit).

---

## Plan A: Oracle Cloud Always Free server

### 1. Create the VM
- Create an Ubuntu 24.04 instance (an Ampere A1 shape is the most generous; any Always Free shape works).
- In the VCN security list, add ingress rules for TCP **80** and **443** from `0.0.0.0/0`.
- Reserve a public IP.

### 2. DNS (at your domain registrar)
| Type | Name | Value |
|---|---|---|
| A | `@` | VM public IP |
| CNAME | `www` | `smartbidsolutions.in` |

### 3. Server setup
```bash
sudo git clone https://github.com/anshhh68/SmartBid-Solutions.git /var/www/smartbid
sudo chown -R $USER /var/www/smartbid
cd /var/www/smartbid
sudo DB_PASSWORD='choose-a-db-password' bash deploy/setup-ubuntu.sh   # Node 22, nginx, PostgreSQL, pm2, certbot, swap, firewall
```

### 4. `backend/.env`
```env
PORT=5000
NODE_ENV=production
DATABASE_URL="postgresql://smartbid:<db-password>@localhost:5432/smartbid_db?schema=public"
DIRECT_URL="postgresql://smartbid:<db-password>@localhost:5432/smartbid_db?schema=public"
JWT_SECRET=<long random string>
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://smartbidsolutions.in
TRUST_PROXY=1
CRON_TZ=Asia/Kolkata
# SMTP_* / EMAIL_FROM as in .env.example, if you want email alerts
```

`frontend/.env`:
```env
VITE_API_URL=/api
```

### 5. Build and start
```bash
mkdir -p backend/uploads
cd backend && npm ci --include=dev && npx prisma generate && npx prisma db push && npm run db:seed && cd ..
cd frontend && npm ci && npm run build && cd ..
pm2 start deploy/ecosystem.config.js && pm2 save && pm2 startup   # run the command pm2 prints
```
(`npm run db:seed` only needs to run once. Change the seeded passwords afterwards.)

### 6. nginx + HTTPS
```bash
sudo cp deploy/nginx/smartbid.conf /etc/nginx/sites-available/smartbid.conf
sudo ln -sf /etc/nginx/sites-available/smartbid.conf /etc/nginx/sites-enabled/smartbid.conf
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d smartbidsolutions.in -d www.smartbidsolutions.in --redirect
```
If you cloned somewhere other than `/var/www/smartbid`, edit `root` in the nginx file.

### 7. Ongoing
- Deploy updates: `bash deploy/update.sh`
- Nightly backups: `crontab -e` and add `0 2 * * * /var/www/smartbid/deploy/backup-db.sh >> $HOME/smartbid-backup.log 2>&1` (keeps the newest 14 in `~/smartbid-backups`). Copy them off the VM now and then.
- Logs: `pm2 logs smartbid-api`

---

## Plan B: Cloudflare (DNS + Pages) + Render + Supabase + Cloudinary + GitHub Actions

### 1. Database: Supabase
In **Project Settings → Database → Connection string**, copy both:
- **Transaction pooler** (port `6543`) → `DATABASE_URL`, adding `?pgbouncer=true` (or `&pgbouncer=true` if it already has a `?`)
- **Session pooler / direct** (port `5432`) → `DIRECT_URL`

### 2. Uploads: Cloudinary
Create a free account and copy the `CLOUDINARY_URL` from the dashboard.
To serve uploaded PDFs, enable **Settings → Security → "Allow delivery of PDF and ZIP files"**. Free accounts block this by default.

### 3. API: Render (Web Service, free)
| Setting | Value |
|---|---|
| Root directory | `backend` |
| Runtime | Node |
| Build command | `npm ci --include=dev && npx prisma generate && npx prisma db push` |
| Start command | `node src/index.js` |
| Health check path | `/health` |

Environment variables:
```env
NODE_ENV=production
NODE_VERSION=22
DATABASE_URL=<Supabase pooler URL, port 6543>?pgbouncer=true
DIRECT_URL=<Supabase URL, port 5432>
JWT_SECRET=<long random string>
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://smartbidsolutions.in
TRUST_PROXY=1
DISABLE_INTERNAL_CRON=true
CRON_SECRET=<long random string>
CLOUDINARY_URL=cloudinary://<key>:<secret>@<cloud>
# SMTP_* / EMAIL_FROM if you want email alerts
```
Seed once from your own machine: `cd backend && DATABASE_URL=<direct URL> DIRECT_URL=<direct URL> npm run db:seed`, then change the seeded passwords.

Under **Settings → Custom Domains**, add `api.smartbidsolutions.in`.

### 4. Domain + DNS: Cloudflare
1. In the Cloudflare dashboard, **Add a domain** → `smartbidsolutions.in` → **Free** plan. Cloudflare imports the existing DNS records.
   Check the imported list before continuing, especially **MX/TXT records for email**, so mail keeps working.
2. At your registrar, replace the nameservers with the two Cloudflare shows. The domain stays registered where it is; only DNS moves.
   Activation usually takes minutes, up to 24 h.
3. **SSL/TLS → Overview**: set the mode to **Full (strict)**.

### 5. Frontend: Cloudflare Pages
**Workers & Pages → Create → Pages → Connect to Git**, pick this repo, branch `main`:

| Setting | Value |
|---|---|
| Framework preset | None (or Vite) |
| Root directory | `frontend` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Env vars (Production) | `VITE_API_URL=https://api.smartbidsolutions.in/api`, `NODE_VERSION=22` |

Every push to `main` redeploys. `VITE_API_URL` is baked in at build time, so after changing it, retry the deployment.
SPA routing works out of the box on Pages (it serves `index.html` for unknown paths).

Under the project's **Custom domains**, add `smartbidsolutions.in` and `www.smartbidsolutions.in`; Cloudflare creates both DNS records itself.
Then make `www` redirect to the apex: **Rules → Redirect Rules → Create from template → "Redirect from WWW to root"**.
CORS only allows the single origin in `FRONTEND_URL`, so the site must be served from that exact origin (`https://smartbidsolutions.in`).

DNS records in Cloudflare when done:
| Type | Name | Value | Proxy |
|---|---|---|---|
| CNAME | `@` | `<project>.pages.dev` (added by Pages) | Proxied |
| CNAME | `www` | `<project>.pages.dev` (added by Pages) | Proxied |
| CNAME | `api` | `<your-service>.onrender.com` | **DNS only** (grey cloud), so Render can issue its certificate |

### 6. Daily sync: GitHub Actions
In the repo, open **Settings → Secrets and variables → Actions** and add:
- `SYNC_URL` = `https://api.smartbidsolutions.in/api/internal/sync-tenders`
- `CRON_SECRET` = the same value as on Render

`.github/workflows/tender-sync.yml` runs daily at 06:00 IST (and can be started by hand from the Actions tab). It retries up to 3 times to wake a sleeping instance. Without the secrets, it logs a message and exits successfully.

Optionally, point a free uptime monitor (e.g. UptimeRobot) at `https://api.smartbidsolutions.in/health` to cut cold starts.

---

## Tender portal proxy (Supabase Edge Function, Mumbai)

GeM and nProcure refuse connections from outside India, so an API on Render (Frankfurt) cannot scrape them directly.
`supabase/functions/portal-proxy` relays requests to those two hosts only. The backend calls it with `x-region: ap-south-1`, because Supabase otherwise runs functions in the region nearest the caller (Europe for Render).
It costs about 25 invocations per sync, well within the free plan.

1. **Deploy:** Supabase → Edge Functions → Deploy a new function → Via editor. Paste `supabase/functions/portal-proxy/index.ts`, name it `portal-proxy`, and deploy.
   Then, in its **Settings**, turn **Verify JWT** off. The function checks its own secret instead.
   (CLI alternative: `npx supabase functions deploy portal-proxy --no-verify-jwt --project-ref <ref>`.)
2. **Create a shared secret:** `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
3. **Supabase:** Edge Functions → Secrets → add `PORTAL_PROXY_SECRET` = that value.
4. **Render:** in Environment, add `PORTAL_PROXY_URL=https://<project-ref>.supabase.co/functions/v1/portal-proxy` and `PORTAL_PROXY_SECRET=<same value>`.

Leave both unset when running from India or in local dev; the sync then connects directly.
