#!/bin/bash

# Spheronix Dashboard - Production Setup Script
# Run this script on your EC2 instance after uploading the code.

set -e # Exit on error

echo "=========================================="
echo "🚀 Spheronix Dashboard - Production Setup"
echo "=========================================="

# 1. Install Global Tools (if not present)
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2 globally..."
    sudo npm install -g pm2
fi

# 2. Install Root Dependencies & Build Frontend
echo "------------------------------------------"
echo "📦 Installing Frontend Dependencies..."
npm install

echo "🏗️  Building Frontend for Production..."
npm run build

if [ -d "dist" ]; then
    echo "✅ Frontend build successful (dist/ created)"
else
    echo "❌ Frontend build failed!"
    exit 1
fi

# 3. Verify Root Environment
echo "------------------------------------------"
if [ ! -f .env ]; then
    echo "❌ Root .env file missing. Aborting."
    exit 1
fi

# 4. Start Backend with PM2
echo "------------------------------------------"
echo "🔄 Starting Backend with PM2..."
pm2 start server.js --name dashboard-backend
pm2 save

echo "=========================================="
echo "✅ Setup Scripts Completed Successfully!"
echo "=========================================="
echo "Next Steps:"
echo "1. Ensure Nginx proxies /api to http://127.0.0.1:5001"
echo "2. Save and enable PM2 startup for reboot persistence (pm2 startup, pm2 save)"
echo "3. Access your website!"
