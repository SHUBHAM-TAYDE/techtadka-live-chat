#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# scripts/health-check.sh
# Run on a cron job or monitoring VM to check all services
# Cron: */5 * * * * /var/www/live-chat/scripts/health-check.sh >> /var/log/health-check.log 2>&1
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Config — edit these ────────────────────────────────────────────────────
APP_HOSTS=("10.0.0.1" "10.0.0.2" "10.0.0.3")
APP_PORT=5000
LB_URL="https://yourdomain.com"
SLACK_WEBHOOK="${SLACK_WEBHOOK_URL:-}"   # Optional
ALERT_EMAIL="${ALERT_EMAIL:-}"          # Optional

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
FAILED=0

log()   { echo "[$TIMESTAMP] $*"; }
alert() {
  log "🚨 ALERT: $*"
  # Slack notification
  if [ -n "$SLACK_WEBHOOK" ]; then
    curl -s -X POST "$SLACK_WEBHOOK" \
      -H 'Content-type: application/json' \
      --data "{\"text\":\"🚨 *Live Chat Alert* — $*\"}" > /dev/null
  fi
}

# ── 1. Check each app instance ─────────────────────────────────────────────
for HOST in "${APP_HOSTS[@]}"; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://${HOST}:${APP_PORT}/health" 2>/dev/null || echo "000")
  if [ "$STATUS" = "200" ]; then
    log "✅ App ${HOST}:${APP_PORT} — HTTP ${STATUS}"
  else
    FAILED=$((FAILED + 1))
    alert "App server ${HOST} returned HTTP ${STATUS} (expected 200)"
  fi
done

# ── 2. Check load balancer ─────────────────────────────────────────────────
LB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${LB_URL}/health" 2>/dev/null || echo "000")
if [ "$LB_STATUS" = "200" ]; then
  log "✅ Load Balancer ${LB_URL} — HTTP ${LB_STATUS}"
else
  FAILED=$((FAILED + 1))
  alert "Load balancer ${LB_URL} returned HTTP ${LB_STATUS}"
fi

# ── 3. Check PM2 on each app server (via SSH) ──────────────────────────────
for HOST in "${APP_HOSTS[@]}"; do
  PM2_STATUS=$(ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no ubuntu@"$HOST" \
    "pm2 jlist 2>/dev/null | python3 -c \"import sys,json; procs=json.load(sys.stdin); print('ok' if all(p['pm2_env']['status']=='online' for p in procs) else 'fail')\"" 2>/dev/null || echo "ssh-fail")
  if [ "$PM2_STATUS" = "ok" ]; then
    log "✅ PM2 on ${HOST} — all processes online"
  else
    FAILED=$((FAILED + 1))
    alert "PM2 on ${HOST} reported: ${PM2_STATUS}"
  fi
done

# ── Summary ────────────────────────────────────────────────────────────────
if [ "$FAILED" -eq 0 ]; then
  log "✅ All checks passed"
else
  alert "${FAILED} check(s) failed — see log for details"
  exit 1
fi
