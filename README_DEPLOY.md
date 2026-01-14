# Spheronix Dashboard - Production Deployment Guide

This guide explains how to deploy the "Spheronix Dashboard" to an AWS EC2 instance (Ubuntu).

## Prerequisites
- AWS Account
- EC2 Instance (Ubuntu 20.04 or 22.04)
- Domain Name (optional, but recommended)

## Step 1: Prepare the Server
Run these commands on your EC2 instance to install necessary software:

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx
sudo npm install -g pm2
```

## Step 2: Upload Code
Upload the project files to the server (e.g., `/var/www/spheronix`).
*Do not upload `node_modules`.*

## Step 3: Run Setup Script
We have included a script to automate the build and startup process.

```bash
cd /var/www/spheronix
chmod +x setup_production.sh
./setup_production.sh
```

**Important:** After the script finishes, edit `backend/.env` to add your **MongoDB URI** and **API Keys**.
```bash
nano backend/.env
# Save and exit (Ctrl+O, Enter, Ctrl+X)
pm2 restart spheronix-backend
```

## Step 4: Configure Nginx
Nginx acts as the web server, serving the frontend and forwarding API requests to the backend.

1. **Copy the configuration:**
   ```bash
   sudo cp nginx.conf.example /etc/nginx/sites-available/spheronix
   ```

2. **Edit the configuration (Optional):**
   If you have a domain, update `server_name _` to `server_name yourdomain.com`.
   ```bash
   sudo nano /etc/nginx/sites-available/spheronix
   ```

3. **Enable the site:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/spheronix /etc/nginx/sites-enabled/
   sudo rm /etc/nginx/sites-enabled/default  # Remove default site
   ```

4. **Test and Restart:**
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```

## Step 5: Verify
- Open your EC2 Public IP (or domain) in a browser.
- The frontend should load.
- Try logging in to verify the backend connection.

## Troubleshooting
- **Backend Status:** `pm2 status` or `pm2 logs spheronix-backend`
- **Nginx Logs:** `sudo tail -f /var/log/nginx/error.log`
- **MongoDB Connection:** Ensure your EC2 IP is whitelisted in MongoDB Atlas Network Access.
