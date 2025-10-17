#!/bin/bash
# -----------------------------------------
# 🍍 Pineapple Donut Local Development Start Script
# -----------------------------------------
# This script starts local DynamoDB, exposes your backend API securely to the world with Cloudflare Tunnel,
# installs and prepares dependencies, and then runs your local backend server.
#
# 🚩 REQUIREMENTS:
#  - cloudflared installed globally (`npm install -g cloudflared` OR `brew install cloudflared`)
#  - Docker (for local DynamoDB)
#  - ~/.cloudflared/tunnel-token.txt (contains your Cloudflare tunnel token)
#
# 🌍 Your API will be available via public Cloudflare URL for frontend and remote clients.
# -----------------------------------------

# Check for required tools and token file
for TOOL in cloudflared docker npm; do
  command -v $TOOL > /dev/null 2>&1 || { echo "❌ $TOOL is not installed!"; exit 1; }
done

if [ ! -r ~/.cloudflared/tunnel-token.txt ]; then
  echo "❌ Tunnel token missing: ~/.cloudflared/tunnel-token.txt"
  exit 1
fi

echo "🚀 Starting local DynamoDB service (may take a moment)..."
npm run dynamo:up

echo "🚀 Starting Cloudflare Tunnel (API exposed securely to the world)..."
nohup cloudflared tunnel run --token-file ~/.cloudflared/tunnel-token.txt > ~/.cloudflared/cloudflared.log 2>&1 &

sleep 1
if pgrep -f "cloudflared tunnel run" > /dev/null; then
  echo "✅ Cloudflared tunnel is running!"
  echo "🔗 See ~/.cloudflared/cloudflared.log for public URL details."
else
  echo "❌ ERROR: Cloudflared tunnel did not start. See logs below:"
  tail -20 ~/.cloudflared/cloudflared.log
  exit 1
fi

echo "📦 Installing npm dependencies..."
npm install

echo "✨ Formatting codebase with Prettier..."
npm run format

echo "🧹 Cleaning build artifacts..."
npm run clean

echo "🛠️ Building TypeScript project..."
npm run build

echo "🟢 Starting backend server..."
npm run offline

echo "🎉 All systems ready! Your API is securely published and available for development!"
