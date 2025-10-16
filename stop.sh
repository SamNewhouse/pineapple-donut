#!/bin/bash

echo "🛑 Shutting down DynamoDB local instance..."
npm run dynamo:down

echo "🛑 Stopping Cloudflared tunnel..."
if pgrep -f "cloudflared tunnel run" > /dev/null; then
  echo "🔪 Killing active Cloudflared tunnel(s)..."
  pkill -f "cloudflared tunnel run"
  sleep 1
  if pgrep -f "cloudflared tunnel run" > /dev/null; then
    echo "⚠️  Could not kill all Cloudflared tunnel processes!"
    echo "You may need to kill them manually: ps aux | grep cloudflared"
  else
    echo "✅ All Cloudflared tunnel processes stopped."
  fi
else
  echo "ℹ️  No Cloudflared tunnels are running."
fi
