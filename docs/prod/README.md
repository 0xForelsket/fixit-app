# FixIt CMMS - On-Premise Production Deployment Guide

This guide covers deploying FixIt to a local server accessible only within your site's network (e.g., `http://fixit.local`).

---

## Prerequisites

| Item                  | Requirement                                                                 |
| --------------------- | --------------------------------------------------------------------------- |
| **Server Hardware**   | Any x86_64 machine (mini PC, NUC, old laptop, Raspberry Pi 5)               |
| **Operating System**  | Ubuntu 22.04 LTS (recommended) or Debian 12                                 |
| **RAM**               | Minimum 2GB, 4GB recommended                                                |
| **Storage**           | Minimum 20GB SSD                                                            |
| **Network Access**    | Static IP on the local network (e.g., `192.168.0.200`)                      |
| **Router Access**     | Ability to configure local DNS or hosts file on client devices              |

---

## Phase 1: Server Setup

### 1.1 Install Node.js (v20+)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v  # Verify >= 20
```

### 1.2 Install Bun (Optional, Faster)

```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
bun -v  # Verify installed
```

### 1.3 Install MinIO (Object Storage)

MinIO is used for storing attachments (photos, documents).

```bash
# Download and install binary
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio
sudo mv minio /usr/local/bin/

# Create data directory
sudo mkdir -p /data/minio
sudo chown $USER:$USER /data/minio

# Create systemd service
sudo tee /etc/systemd/system/minio.service > /dev/null <<EOF
[Unit]
Description=MinIO Object Storage
After=network.target

[Service]
User=$USER
Group=$USER
ExecStart=/usr/local/bin/minio server /data/minio --console-address ":9001"
Restart=always
Environment="MINIO_ROOT_USER=minioadmin"
Environment="MINIO_ROOT_PASSWORD=minioadmin"

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable minio
sudo systemctl start minio
```

Access MinIO console at `http://<server-ip>:9001` to create a bucket called `fixit-uploads`.

---

## Phase 2: Application Deployment

### 2.1 Clone the Repository

```bash
cd /opt
sudo mkdir fixit-app && sudo chown $USER:$USER fixit-app
git clone https://github.com/YOUR_ORG/fixit-app.git /opt/fixit-app
cd /opt/fixit-app
```

### 2.2 Install Dependencies

```bash
bun install  # or npm install
```

### 2.3 Configure Environment

```bash
cp .env.example .env
nano .env
```

**Required `.env` values:**

```ini
# Database (SQLite - local file)
DATABASE_URL="file:/opt/fixit-app/data/fixit.db"

# Session Secret (generate with: openssl rand -base64 32)
SESSION_SECRET="your-secret-key-here"

# MinIO / S3 Storage
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin"
S3_BUCKET="fixit-uploads"
S3_REGION="us-east-1"

# App URL (used for QR codes, emails, etc.)
NEXT_PUBLIC_APP_URL="http://fixit.local"
```

### 2.4 Initialize Database

```bash
mkdir -p /opt/fixit-app/data
bun run db:push   # Push schema to SQLite
bun run db:seed   # Optional: Seed with demo data
```

### 2.5 Build for Production

```bash
bun run build
```

---

## Phase 3: Process Manager (PM2)

PM2 keeps the app running and restarts it on crashes.

### 3.1 Install PM2

```bash
sudo npm install -g pm2
```

### 3.2 Start the Application

```bash
cd /opt/fixit-app
pm2 start npm --name "fixit" -- start
pm2 save
pm2 startup  # Follow the printed command to enable on boot
```

### 3.3 Useful PM2 Commands

```bash
pm2 status       # Check if running
pm2 logs fixit   # View logs
pm2 restart fixit
pm2 stop fixit
```

---

## Phase 4: Reverse Proxy (Nginx)

Nginx handles HTTPS, caching, and serves the app on port 80.

### 4.1 Install Nginx

```bash
sudo apt install nginx -y
```

### 4.2 Configure Site

```bash
sudo nano /etc/nginx/sites-available/fixit
```

**Paste:**

```nginx
server {
    listen 80;
    server_name fixit.local;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4.3 Enable and Restart

```bash
sudo ln -s /etc/nginx/sites-available/fixit /etc/nginx/sites-enabled/
sudo nginx -t  # Test config
sudo systemctl restart nginx
```

---

## Phase 5: Local DNS Configuration

To access the app via `http://fixit.local`, you must tell devices on your network how to resolve that name.

### Option A: Router DNS (Recommended)

Most routers support custom DNS entries:

1.  Login to your router admin panel (usually `192.168.0.1`).
2.  Find "DNS" or "Hostname" settings.
3.  Add: `fixit.local` → `192.168.0.200` (your server IP).

*All devices on the network will now resolve `fixit.local` automatically.*

### Option B: Per-Device Hosts File

If you can't modify the router, edit each device's hosts file.

**Windows:** `C:\Windows\System32\drivers\etc\hosts`
**macOS/Linux:** `/etc/hosts`
**Android:** Requires root or use a local DNS app.

Add the line:

```
192.168.0.200    fixit.local
```

---

## Phase 6: Firewall

Allow HTTP traffic to the server.

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow 22/tcp  # SSH
sudo ufw enable
sudo ufw status
```

---

## Phase 7: Backups

### 7.1 Database Backup Script

```bash
sudo nano /opt/fixit-app/backup.sh
```

**Paste:**

```bash
#!/bin/bash
DATE=$(date +%Y-%m-%d_%H-%M)
BACKUP_DIR="/opt/fixit-app/backups"
mkdir -p $BACKUP_DIR
cp /opt/fixit-app/data/fixit.db "$BACKUP_DIR/fixit_$DATE.db"

# Keep only last 7 backups
ls -t $BACKUP_DIR/*.db | tail -n +8 | xargs -r rm
```

```bash
chmod +x /opt/fixit-app/backup.sh
```

### 7.2 Schedule Daily Backups

```bash
crontab -e
```

Add:

```
0 3 * * * /opt/fixit-app/backup.sh
```

---

## Phase 8: Updates

To deploy new code changes:

```bash
cd /opt/fixit-app
git pull origin main
bun install
bun run build
pm2 restart fixit
```

---

## Verification Checklist

| Task                                  | Command / Action                                      |
| ------------------------------------- | ----------------------------------------------------- |
| Server is reachable on LAN            | `ping 192.168.0.200` from another device              |
| App is running                        | `pm2 status`                                          |
| Nginx is proxying                     | `curl http://fixit.local`                             |
| MinIO is running                      | Access `http://192.168.0.200:9001`                    |
| Database exists                       | `ls /opt/fixit-app/data/fixit.db`                     |
| Backups are scheduled                 | `crontab -l`                                          |

---

## Troubleshooting

| Issue                         | Solution                                                                 |
| ----------------------------- | ------------------------------------------------------------------------ |
| `fixit.local` not resolving   | Check local DNS or hosts file on the client device.                      |
| `pm2 status` shows errored    | Check `pm2 logs fixit` for errors.                                       |
| 502 Bad Gateway               | App is not running. Run `pm2 restart fixit`.                             |
| Permission denied on DB       | `sudo chown -R $USER:$USER /opt/fixit-app/data`                          |
| MinIO connection refused      | Check `sudo systemctl status minio`.                                     |
