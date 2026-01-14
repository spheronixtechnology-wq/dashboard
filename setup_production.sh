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
# Ensure .env.production exists
if [ ! -f .env.production ]; then
    echo "⚠️  .env.production not found. Creating default..."
    echo "VITE_API_URL=/api" > .env.production
fi

npm run build

if [ -d "dist" ]; then
    echo "✅ Frontend build successful (dist/ created)"
else
    echo "❌ Frontend build failed!"
    exit 1
fi

# 3. Install Backend Dependencies
echo "------------------------------------------"
echo "📦 Installing Backend Dependencies..."
cd backend
npm install

# 4. Check Backend Environment
if [ ! -f .env ]; then
    echo "⚠️  backend/.env file missing!"
    echo "📝 Creating backend/.env template..."
    cat <<EOT >> .env
NODE_ENV=production
PORT=5001
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/dbname
GEMINI_API_KEY=your_gemini_api_key_here
FRONTEND_URL=http://localhost
EOT
    echo "⚠️  PLEASE EDIT backend/.env WITH YOUR REAL SECRETS BEFORE STARTING!"
fi

# 5. Start Backend with PM2
echo "------------------------------------------"
echo "🔄 Starting Backend with PM2..."
pm2 start ecosystem.config.js
pm2 save

echo "=========================================="
echo "✅ Setup Scripts Completed Successfully!"
echo "=========================================="
echo "Next Steps:"
echo "1. Edit 'backend/.env' with your real MongoDB URI and API Keys."
echo "2. Restart backend: 'pm2 restart spheronix-backend'"
echo "3. Configure Nginx using 'nginx.conf.example' (see README_DEPLOY.md)"
echo "4. Access your website!"
