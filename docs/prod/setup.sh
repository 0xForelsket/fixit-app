#!/bin/bash
set -e

# ==============================================================================
# FixIt CMMS - Production Setup Script
# Run this on a fresh Ubuntu 22.04 LTS server
# Usage: sudo ./setup.sh
# ==============================================================================

echo "===================================="
echo " FixIt CMMS - Production Setup"
echo "===================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "❌ Please run as root (sudo ./setup.sh)"
  exit 1
fi

# Get the actual user (not root)
ACTUAL_USER=${SUDO_USER:-$USER}
APP_DIR="/opt/fixit-app"
DATA_DIR="$APP_DIR/data"
BACKUP_DIR="$APP_DIR/backups"

# ==============================================================================
# Phase 1: System Dependencies
# ==============================================================================
echo ""
echo "📦 Installing system dependencies..."
apt-get update -qq
apt-get install -y -qq curl wget git nginx ufw

# Node.js 20
echo "📦 Installing Node.js 20..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -qq nodejs
fi
echo "   Node.js version: $(node -v)"

# Bun
echo "📦 Installing Bun..."
if ! command -v bun &> /dev/null; then
  su - $ACTUAL_USER -c "curl -fsSL https://bun.sh/install | bash"
fi

# PM2
echo "📦 Installing PM2..."
npm install -g pm2 --silent

# ==============================================================================
# Phase 2: MinIO Object Storage
# ==============================================================================
echo ""
echo "📦 Setting up MinIO..."
if [ ! -f /usr/local/bin/minio ]; then
  wget -q https://dl.min.io/server/minio/release/linux-amd64/minio -O /usr/local/bin/minio
  chmod +x /usr/local/bin/minio
fi

mkdir -p /data/minio
chown $ACTUAL_USER:$ACTUAL_USER /data/minio

# Create MinIO systemd service
cat > /etc/systemd/system/minio.service <<EOF
[Unit]
Description=MinIO Object Storage
After=network.target

[Service]
User=$ACTUAL_USER
Group=$ACTUAL_USER
ExecStart=/usr/local/bin/minio server /data/minio --console-address ":9001"
Restart=always
Environment="MINIO_ROOT_USER=minioadmin"
Environment="MINIO_ROOT_PASSWORD=minioadmin"

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable minio --quiet
systemctl start minio
echo "   MinIO started on :9000 (Console: :9001)"

# ==============================================================================
# Phase 3: Application Setup
# ==============================================================================
echo ""
echo "📦 Setting up application directory..."
mkdir -p $APP_DIR $DATA_DIR $BACKUP_DIR
chown -R $ACTUAL_USER:$ACTUAL_USER $APP_DIR

# Check if app files exist
if [ ! -f "$APP_DIR/package.json" ]; then
  echo ""
  echo "⚠️  No application files found in $APP_DIR"
  echo "   Please copy or clone your app to $APP_DIR first."
  echo "   Then run this script again."
  echo ""
  echo "   Example:"
  echo "   git clone https://github.com/YOUR_ORG/fixit-app.git $APP_DIR"
  exit 1
fi

# Generate session secret if not set
SESSION_SECRET=$(openssl rand -base64 32)

# Create .env if it doesn't exist
if [ ! -f "$APP_DIR/.env" ]; then
  echo "📄 Creating .env file..."
  cat > $APP_DIR/.env <<EOF
# Database
DATABASE_URL="file:$DATA_DIR/fixit.db"

# Session (auto-generated)
SESSION_SECRET="$SESSION_SECRET"

# MinIO Object Storage
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin"
S3_BUCKET="fixit-uploads"
S3_REGION="us-east-1"

# App URL (update this to your local DNS name)
NEXT_PUBLIC_APP_URL="http://fixit.local"
EOF
  chown $ACTUAL_USER:$ACTUAL_USER $APP_DIR/.env
fi

# Build the app
echo ""
echo "🔨 Building application..."
cd $APP_DIR
su - $ACTUAL_USER -c "cd $APP_DIR && bun install && bun run db:push && bun run build"

# ==============================================================================
# Phase 4: PM2 Process Manager
# ==============================================================================
echo ""
echo "🚀 Starting application with PM2..."
su - $ACTUAL_USER -c "cd $APP_DIR && pm2 delete fixit 2>/dev/null || true"
su - $ACTUAL_USER -c "cd $APP_DIR && pm2 start npm --name 'fixit' -- start"
su - $ACTUAL_USER -c "pm2 save"

# Setup PM2 startup
pm2 startup systemd -u $ACTUAL_USER --hp /home/$ACTUAL_USER --quiet

# ==============================================================================
# Phase 5: Nginx Reverse Proxy
# ==============================================================================
echo ""
echo "🌐 Configuring Nginx..."
cat > /etc/nginx/sites-available/fixit <<EOF
server {
    listen 80;
    server_name fixit.local;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/fixit /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx

# ==============================================================================
# Phase 6: Firewall
# ==============================================================================
echo ""
echo "🔒 Configuring firewall..."
ufw allow 'Nginx Full' --quiet
ufw allow 22/tcp --quiet
ufw --force enable --quiet
echo "   Firewall enabled (HTTP, HTTPS, SSH allowed)"

# ==============================================================================
# Phase 7: Backup Script
# ==============================================================================
echo ""
echo "💾 Setting up daily backups..."
cat > $APP_DIR/backup.sh <<'EOF'
#!/bin/bash
DATE=$(date +%Y-%m-%d_%H-%M)
BACKUP_DIR="/opt/fixit-app/backups"
mkdir -p $BACKUP_DIR
cp /opt/fixit-app/data/fixit.db "$BACKUP_DIR/fixit_$DATE.db"
ls -t $BACKUP_DIR/*.db | tail -n +8 | xargs -r rm
EOF
chmod +x $APP_DIR/backup.sh
chown $ACTUAL_USER:$ACTUAL_USER $APP_DIR/backup.sh

# Add cron job for backups (daily at 3 AM)
(crontab -u $ACTUAL_USER -l 2>/dev/null | grep -v backup.sh; echo "0 3 * * * $APP_DIR/backup.sh") | crontab -u $ACTUAL_USER -

# ==============================================================================
# Done!
# ==============================================================================
SERVER_IP=$(hostname -I | awk '{print $1}')

echo ""
echo "===================================="
echo " ✅ Setup Complete!"
echo "===================================="
echo ""
echo " Server IP: $SERVER_IP"
echo " App URL:   http://fixit.local"
echo ""
echo " 📋 Next Steps:"
echo " 1. Configure your router DNS to point fixit.local → $SERVER_IP"
echo "    OR add this line to client devices' hosts file:"
echo "       $SERVER_IP    fixit.local"
echo ""
echo " 2. Access MinIO console to create bucket 'fixit-uploads':"
echo "    http://$SERVER_IP:9001 (admin/minioadmin)"
echo ""
echo " 3. Seed the database with demo data (optional):"
echo "    cd $APP_DIR && bun run db:seed"
echo ""
echo " 📊 Useful Commands:"
echo "    pm2 status          # Check app status"
echo "    pm2 logs fixit      # View app logs"
echo "    pm2 restart fixit   # Restart app"
echo ""
