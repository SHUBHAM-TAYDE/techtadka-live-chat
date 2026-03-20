#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# scripts/setup-appserver.sh
# Run once on a fresh Utho Ubuntu 22.04 VM to prepare it as an app server
# Usage: sudo bash setup-appserver.sh
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

echo "=============================================="
echo "  Live Chat — App Server Setup"
echo "  Tech Tadka With Shubham × Utho Cloud"
echo "=============================================="

# ── 1. System updates ──────────────────────────────────────────────────────
echo ""
echo "→ [1/7] Updating system packages..."
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq curl wget git ufw fail2ban

# ── 2. Firewall (UFW) ─────────────────────────────────────────────────────
echo ""
echo "→ [2/7] Configuring firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh        # Port 22
ufw allow 80/tcp     # HTTP (Nginx)
ufw allow 443/tcp    # HTTPS (Nginx)
# Port 5000 (Node.js) is NOT exposed — Nginx proxies to it internally
ufw --force enable
echo "   UFW enabled. Open ports: 22, 80, 443"

# ── 3. Node.js 20 ─────────────────────────────────────────────────────────
echo ""
echo "→ [3/7] Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
echo "   Node.js: $(node --version)"
echo "   npm:     $(npm --version)"

# ── 4. PM2 ────────────────────────────────────────────────────────────────
echo ""
echo "→ [4/7] Installing PM2..."
npm install -g pm2
pm2 startup systemd -u ubuntu --hp /home/ubuntu | tail -1 | bash || true
mkdir -p /var/log/pm2
chown ubuntu:ubuntu /var/log/pm2
echo "   PM2: $(pm2 --version)"

# ── 5. Nginx ──────────────────────────────────────────────────────────────
echo ""
echo "→ [5/7] Installing Nginx..."
apt-get install -y nginx
systemctl enable nginx
echo "   Nginx: $(nginx -v 2>&1)"

# ── 6. Certbot (Let's Encrypt) ────────────────────────────────────────────
echo ""
echo "→ [6/7] Installing Certbot..."
apt-get install -y certbot python3-certbot-nginx
echo "   Certbot: $(certbot --version)"

# ── 7. App directory ──────────────────────────────────────────────────────
echo ""
echo "→ [7/7] Creating app directory..."
mkdir -p /var/www/live-chat/{dist,server}
chown -R ubuntu:ubuntu /var/www/live-chat

# ── Done ──────────────────────────────────────────────────────────────────
echo ""
echo "=============================================="
echo "✅ App server is ready!"
echo ""
echo "Next steps:"
echo "  1. Deploy your code:    rsync -avz ./server/ ubuntu@<THIS_IP>:/var/www/live-chat/server/"
echo "  2. Set up .env:         nano /var/www/live-chat/server/.env"
echo "  3. Install deps:        cd /var/www/live-chat/server && npm ci --only=production"
echo "  4. Configure Nginx:     cp nginx/default.conf /etc/nginx/sites-available/live-chat"
echo "  5. Start app:           pm2 start ecosystem.config.js --env production && pm2 save"
echo "  6. Enable SSL:          certbot --nginx -d yourdomain.com"
echo "=============================================="
