#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# scripts/setup-redis.sh
# Run this on your Utho Redis VM to install and secure Redis
# Usage: sudo bash setup-redis.sh <REDIS_PASSWORD> <PRIVATE_IP>
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

REDIS_PASSWORD="${1:?Usage: $0 <REDIS_PASSWORD> <PRIVATE_IP>}"
PRIVATE_IP="${2:?Usage: $0 <REDIS_PASSWORD> <PRIVATE_IP>}"

echo "→ Updating packages..."
apt-get update -qq

echo "→ Installing Redis..."
apt-get install -y redis-server

echo "→ Backing up default config..."
cp /etc/redis/redis.conf /etc/redis/redis.conf.bak

echo "→ Configuring Redis..."
cat > /etc/redis/redis.conf << EOF
# Network — only listen on private IP and loopback
bind ${PRIVATE_IP} 127.0.0.1
port 6379
protected-mode yes

# Auth
requirepass ${REDIS_PASSWORD}

# Persistence — AOF for durability
appendonly yes
appendfsync everysec
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb

# Memory — evict LRU when full (good for caching/pub-sub)
maxmemory 512mb
maxmemory-policy allkeys-lru

# Performance
tcp-keepalive 300
timeout 0
tcp-backlog 511
hz 10

# Logging
loglevel notice
logfile /var/log/redis/redis-server.log

# Disable dangerous commands
rename-command FLUSHALL  ""
rename-command FLUSHDB   ""
rename-command DEBUG     ""
rename-command CONFIG    "CONFIG_${REDIS_PASSWORD:0:8}"
EOF

echo "→ Setting permissions..."
chown redis:redis /etc/redis/redis.conf
chmod 640 /etc/redis/redis.conf

echo "→ Enabling and starting Redis..."
systemctl enable redis-server
systemctl restart redis-server

echo "→ Waiting for Redis to start..."
sleep 2

echo "→ Verifying connection..."
redis-cli -h "${PRIVATE_IP}" -a "${REDIS_PASSWORD}" ping

echo ""
echo "✅ Redis setup complete!"
echo "   Host:     ${PRIVATE_IP}:6379"
echo "   Password: [set]"
echo "   Max RAM:  512mb"
