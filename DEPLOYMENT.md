# Deploying SmartBid Solutions to smartbidsolutions.in

There are two free hosting options. Pick one.

| | Plan A: Oracle Cloud server | Plan B: managed free services |
|---|---|---|
| Frontend | nginx on the VM | Netlify |
| API | Node + pm2 on the VM | Render (free web service) |
| Database | PostgreSQL on the VM | Neon |
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

## Plan B: Netlify + Render + Neon + Cloudinary + GitHub Actions

### 1. Database: Neon
Create a project, then copy both connection strings:
- **Pooled** (host contains `-pooler`) → `DATABASE_URL`, adding `&pgbouncer=true` to it
- **Direct** → `DIRECT_URL`

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
DATABASE_URL=<Neon pooled URL>&pgbouncer=true
DIRECT_URL=<Neon direct URL>
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

### 4. Frontend: Netlify
| Setting | Value |
|---|---|
| Base directory | `frontend` |
| Build command | `npm run build` |
| Publish directory | `frontend/dist` |
| Env var | `VITE_API_URL=https://api.smartbidsolutions.in/api`, `NODE_VERSION=22` |

SPA routing comes from `frontend/public/_redirects`. Add the custom domain `smartbidsolutions.in` and set it as **primary**, so `www` redirects to it.
CORS only allows the single origin in `FRONTEND_URL`, so the site must be served from that exact origin.

### 5. DNS (at your domain registrar)
| Type | Name | Value |
|---|---|---|
| A | `@` | Netlify load balancer IP shown in Netlify's domain settings (currently `75.2.60.5`) |
| CNAME | `www` | `<your-site>.netlify.app` |
| CNAME | `api` | `<your-service>.onrender.com` |

### 6. Daily sync: GitHub Actions
In the repo, open **Settings → Secrets and variables → Actions** and add:
- `SYNC_URL` = `https://api.smartbidsolutions.in/api/internal/sync-tenders`
- `CRON_SECRET` = the same value as on Render

`.github/workflows/tender-sync.yml` runs daily at 06:00 IST (and can be started by hand from the Actions tab). It retries up to 3 times to wake a sleeping instance. Without the secrets, it logs a message and exits successfully.

Optionally, point a free uptime monitor (e.g. UptimeRobot) at `https://api.smartbidsolutions.in/health` to cut cold starts.
