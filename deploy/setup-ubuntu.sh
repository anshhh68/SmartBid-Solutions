#!/usr/bin/env bash
# One-time server setup for Ubuntu 24.04 (Oracle Cloud Always Free). Safe to re-run.
# Usage:  sudo DB_PASSWORD='...' bash deploy/setup-ubuntu.sh
# Creates no app secrets: you still write backend/.env yourself (see DEPLOYMENT.md).
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then echo "Run with sudo." >&2; exit 1; fi

DB_NAME="${DB_NAME:-smartbid_db}"
DB_USER="${DB_USER:-smartbid}"
if [ -z "${DB_PASSWORD:-}" ]; then
  read -rsp "Password for PostgreSQL user '$DB_USER': " DB_PASSWORD; echo
fi
[ -n "$DB_PASSWORD" ] || { echo "DB_PASSWORD is required." >&2; exit 1; }

export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y curl git nginx postgresql postgresql-contrib certbot python3-certbot-nginx iptables-persistent

# Node 22 (NodeSource)
if ! command -v node >/dev/null || [ "$(node -v | cut -d. -f1)" != "v22" ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
command -v pm2 >/dev/null || npm install -g pm2

# Swap when RAM < 2 GB (npm ci / vite build need it on 1 GB instances)
MEM_KB="$(awk '/MemTotal/ {print $2}' /proc/meminfo)"
if [ "$MEM_KB" -lt 2000000 ] && ! swapon --show | grep -q /swapfile; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# Oracle Cloud images ship a REJECT rule in iptables; open 80/443 at the top so they come before it
for PORT in 80 443; do
  iptables -C INPUT -p tcp --dport "$PORT" -m state --state NEW -j ACCEPT 2>/dev/null \
    || iptables -I INPUT 1 -p tcp --dport "$PORT" -m state --state NEW -j ACCEPT
done
netfilter-persistent save

# PostgreSQL role + database
# psql variables (:"user" / :'pw') quote the values, so any password characters are safe
sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1 \
  || echo "CREATE ROLE :\"user\" LOGIN PASSWORD :'pw';" \
     | sudo -u postgres psql -v ON_ERROR_STOP=1 -v user="$DB_USER" -v pw="$DB_PASSWORD"
sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 \
  || sudo -u postgres createdb -O "$DB_USER" "$DB_NAME"

systemctl enable --now nginx postgresql

echo
echo "Done. DATABASE_URL=postgresql://$DB_USER:<password>@localhost:5432/$DB_NAME?schema=public"
echo "Next steps: see DEPLOYMENT.md (Plan A)."
