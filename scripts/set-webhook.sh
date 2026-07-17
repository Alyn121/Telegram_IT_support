#!/bin/bash
if [ -z "$1" ]; then
  echo "Usage: ./set-webhook.sh <VERCEL_URL>"
  exit 1
fi

URL=$1
# Ensure source .env.local works for TELEGRAM_BOT_TOKEN
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
  echo "Error: TELEGRAM_BOT_TOKEN not found in .env.local"
  exit 1
fi

if [ -z "$TELEGRAM_WEBHOOK_SECRET" ]; then
  echo "Warning: TELEGRAM_WEBHOOK_SECRET not set, continuing without it..."
fi

curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{
       "url": "'"${URL}"'/api/telegram",
       "secret_token": "'"${TELEGRAM_WEBHOOK_SECRET}"'"
     }'
echo ""
