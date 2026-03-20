# 🚀 Utho Cloud Deployment Guide
## Live Chat App — Tech Tadka With Shubham

---

## Overview

You will provision the following on Utho Cloud:

| Resource              | Qty | Purpose                          |
|-----------------------|-----|----------------------------------|
| Utho VM (App Server)  | 3   | Node.js + Socket.io instances    |
| Utho VM (Redis)       | 1   | Socket.io pub/sub adapter        |
| Utho Managed PostgreSQL | 1 | Primary database                 |
| Utho Load Balancer    | 1   | HTTP + WebSocket balancing       |
| Utho Auto Scaling     | 1   | Scale app servers on CPU/memory  |

---

## Step 1 — Provision Utho Managed PostgreSQL

1. Log in to Utho Cloud Console
2. Go to **Managed Databases → Create**
3. Select **PostgreSQL 16**, choose your region
4. Set DB Name: `livechat`, Username: `livechat_user`, strong password
5. Note the **Connection Host** — you'll use it in your `.env`
6. Once running, connect and run the schema:

```bash
psql "host=<DB_HOST> port=5432 dbname=livechat user=livechat_user sslmode=require" \
  -f server/models/schema.sql
```

---

## Step 2 — Provision Redis VM

1. Create a Utho VM: **Ubuntu 22.04, 2 vCPU, 2GB RAM**
2. SSH in and install Redis:

```bash
sudo apt update && sudo apt install -y redis-server

# Set a password and bind to private IP only
sudo nano /etc/redis/redis.conf
# Edit these lines:
#   bind 0.0.0.0   →  bind <PRIVATE_IP> 127.0.0.1
#   requirepass    →  requirepass your_strong_redis_password

sudo systemctl restart redis
sudo systemctl enable redis

# Verify
redis-cli -a your_strong_redis_password ping
# Should print: PONG
```

3. Note the **private IP** of this VM — it goes in `REDIS_HOST` in your `.env`

---

## Step 3 — Create a Golden VM Image (App Server)

Set up one VM perfectly, then snapshot it for auto-scaling.

### 3a. Create Base VM
1. Create a Utho VM: **Ubuntu 22.04, 2 vCPU, 4GB RAM**
2. SSH in:

```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Create app directory
sudo mkdir -p /var/www/live-chat
sudo chown $USER:$USER /var/www/live-chat
```

### 3b. Deploy the Backend

```bash
# Clone your repo (or SCP the files)
cd /var/www/live-chat
git clone https://github.com/yourusername/live-chat-app.git .

# Install backend dependencies
cd server
npm install --production

# Create .env from example
cp .env.example .env
nano .env
# Fill in all values: DB_HOST, REDIS_HOST, JWT_SECRET, CORS_ORIGINS etc.
```

### 3c. Configure Nginx

```bash
# Copy the Nginx config
sudo cp /var/www/live-chat/nginx/default.conf /etc/nginx/sites-available/live-chat
sudo ln -s /etc/nginx/sites-available/live-chat /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl enable nginx
```

### 3d. Start with PM2

```bash
cd /var/www/live-chat/server
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup   # Follow the command it prints to enable on reboot
```

### 3e. Verify single-instance works

```bash
curl http://localhost:5000/health
# Should return: {"status":"ok", ...}
```

### 3f. Take a Snapshot

In Utho Console → **Snapshots → Create Snapshot** from this VM.
Name it: `live-chat-golden-v1`
This snapshot will be used by the Auto Scaling group.

---

## Step 4 — Create 2 More App Server VMs

1. In Utho Console, create 2 more VMs **from the golden snapshot**
2. They will boot with Node.js, PM2, Nginx, and your app pre-installed
3. SSH into each and start PM2:

```bash
cd /var/www/live-chat/server
pm2 start ecosystem.config.js --env production
pm2 save
```

Note down the **private IPs** of all 3 app VMs.

---

## Step 5 — Set Up the Utho Load Balancer

1. Go to **Load Balancers → Create**
2. Set **Protocol**: HTTP + HTTPS (TCP for WebSocket support)
3. Add **Backend Pool**:
   - Add all 3 app VM private IPs on port `5000`
   - Health Check Path: `/health`
   - Health Check Interval: 10s
4. Enable **Sticky Sessions** (Cookie-based)
   - ⚠️ This is critical for Socket.io polling fallback
5. Set **Session Persistence**: 1 hour
6. Point your domain DNS to the Load Balancer IP

---

## Step 6 — Set Up SSL (Let's Encrypt)

Run this on **each** app VM:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
sudo systemctl reload nginx
```

---

## Step 7 — Set Up Utho Auto Scaling

1. Go to **Auto Scaling → Create Group**
2. Select:
   - **Launch Template**: your `live-chat-golden-v1` snapshot
   - **Min instances**: 2
   - **Max instances**: 6
   - **Desired**: 3
3. Set **Scale-Out Rule**: CPU > 70% for 2 minutes → add 1 instance
4. Set **Scale-In Rule**: CPU < 30% for 5 minutes → remove 1 instance
5. Attach to your Load Balancer backend pool

---

## Step 8 — Firewall Rules (Security Groups)

| VM Type     | Allow Inbound               | Source               |
|-------------|-----------------------------|----------------------|
| App Servers | Port 5000 (Node.js)         | Load Balancer IP only|
| App Servers | Port 80, 443 (Nginx)        | 0.0.0.0/0            |
| App Servers | Port 22 (SSH)               | Your IP only         |
| Redis VM    | Port 6379                   | App Server IPs only  |
| PostgreSQL  | Port 5432                   | App Server IPs only  |

---

## Step 9 — Verify the Full Setup

```bash
# 1. Check health through the Load Balancer
curl https://yourdomain.com/health

# 2. Check all 3 Node.js processes are up
pm2 list

# 3. Test WebSocket connection (install wscat)
npx wscat -c "wss://yourdomain.com/socket.io/?transport=websocket"

# 4. Load test with Artillery
npx artillery quick --count 100 --num 10 https://yourdomain.com/health
```

---

## 📋 Checklist Before Going Live

- [ ] All `.env` values set correctly on every VM
- [ ] PostgreSQL schema applied
- [ ] Redis password set and firewalled
- [ ] Nginx config tested (`nginx -t`)
- [ ] SSL certificates installed
- [ ] Health check endpoint returns 200
- [ ] Load Balancer sticky sessions enabled
- [ ] Auto Scaling group attached to Load Balancer
- [ ] Firewall rules locked down
- [ ] PM2 startup script registered (`pm2 startup`)

---

## Useful Commands

```bash
# View real-time logs
pm2 logs live-chat-server

# Reload app with zero downtime
pm2 reload live-chat-server

# Monitor CPU/memory
pm2 monit

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Test Redis connectivity from app VM
redis-cli -h <REDIS_PRIVATE_IP> -a your_redis_password ping

# Test PostgreSQL connectivity from app VM
psql "host=<DB_HOST> dbname=livechat user=livechat_user sslmode=require"
```
