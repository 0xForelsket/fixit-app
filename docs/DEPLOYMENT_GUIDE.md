# FixIt CMMS - Deployment Guide

This guide covers deploying FixIt CMMS in production environments.

## Table of Contents

1. [Requirements](#requirements)
2. [Environment Variables](#environment-variables)
3. [Database Setup](#database-setup)
4. [Object Storage Setup](#object-storage-setup)
5. [Building the Application](#building-the-application)
6. [Deployment Options](#deployment-options)
7. [Post-Deployment](#post-deployment)
8. [Monitoring](#monitoring)
9. [Troubleshooting](#troubleshooting)

---

## Requirements

### Runtime
- **Node.js** 18+ or **Bun** 1.0+
- **SQLite** (embedded) or LibSQL-compatible database
- **S3-compatible storage** (AWS S3, MinIO, DigitalOcean Spaces)

### System Resources (Recommended)
| Environment | CPU | Memory | Storage |
|-------------|-----|--------|---------|
| Development | 1 core | 1 GB | 1 GB |
| Production | 2 cores | 2 GB | 10 GB+ |

### Technology Stack
- **Framework:** Next.js 15.1.0
- **Runtime:** React 19
- **Database ORM:** Drizzle ORM
- **UI:** Tailwind CSS 4.0, Radix UI

---

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SESSION_SECRET` | JWT signing key (32+ chars) | `openssl rand -base64 32` |
| `NODE_ENV` | Environment mode | `production` |

### Database Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | SQLite database path | `file:./data/local.db` |

### Object Storage (S3/MinIO)

| Variable | Description | Default |
|----------|-------------|---------|
| `S3_ENDPOINT` | S3 API endpoint | `http://localhost:9000` |
| `S3_REGION` | S3 region | `us-east-1` |
| `S3_BUCKET` | Bucket name | `fixit-attachments` |
| `S3_ACCESS_KEY` | Access key ID | `minioadmin` |
| `S3_SECRET_KEY` | Secret access key | `minioadmin` |

### Session Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `SESSION_MAX_AGE` | Session expiry (seconds) | `86400` (24 hours) |

### Scheduler

| Variable | Description | Default |
|----------|-------------|---------|
| `CRON_SECRET` | Secret for scheduler endpoint | `your-cron-secret-here` |

### Logging

| Variable | Description | Default |
|----------|-------------|---------|
| `LOG_LEVEL` | Pino log level | `info` (production) |

### Optional: Email (SMTP)

| Variable | Description |
|----------|-------------|
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | SMTP port (usually 587) |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `SMTP_FROM` | From address |

### Example .env.production

```bash
# Required
NODE_ENV=production
SESSION_SECRET=your-32-character-or-longer-secret-here

# Database
DATABASE_URL=file:/data/fixit.db

# Object Storage
S3_ENDPOINT=https://s3.amazonaws.com
S3_REGION=us-east-1
S3_BUCKET=fixit-attachments
S3_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE
S3_SECRET_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

# Session
SESSION_MAX_AGE=86400

# Scheduler
CRON_SECRET=secure-random-cron-secret

# Logging
LOG_LEVEL=info
```

### Generating Secrets

```bash
# Generate SESSION_SECRET
openssl rand -base64 32

# Generate CRON_SECRET
openssl rand -hex 16
```

---

## Database Setup

### SQLite (Default)

FixIt uses SQLite by default, which requires no external database server.

1. **Create data directory:**
   ```bash
   mkdir -p /data
   ```

2. **Set database path:**
   ```bash
   export DATABASE_URL=file:/data/fixit.db
   ```

3. **Initialize schema:**
   ```bash
   bun run db:push
   ```

4. **Optional: Seed initial data:**
   ```bash
   bun run db:seed
   ```

### Database Commands

| Command | Description |
|---------|-------------|
| `bun run db:push` | Apply schema to database |
| `bun run db:migrate` | Run pending migrations |
| `bun run db:generate` | Generate migrations from schema |
| `bun run db:studio` | Open Drizzle Studio (dev tool) |
| `bun run db:seed` | Seed development data |

### Backups

```bash
# Simple file backup
cp /data/fixit.db /backups/fixit-$(date +%Y%m%d).db

# With compression
sqlite3 /data/fixit.db ".backup /backups/fixit.db" && gzip /backups/fixit.db
```

---

## Object Storage Setup

FixIt requires S3-compatible storage for file attachments.

### Option 1: AWS S3

1. Create an S3 bucket
2. Create an IAM user with S3 access
3. Configure environment variables:
   ```bash
   S3_ENDPOINT=https://s3.amazonaws.com
   S3_REGION=us-east-1
   S3_BUCKET=your-fixit-bucket
   S3_ACCESS_KEY=your-access-key
   S3_SECRET_KEY=your-secret-key
   ```

### Option 2: MinIO (Self-Hosted)

1. **Start MinIO with Docker:**
   ```bash
   docker run -d \
     --name fixit-minio \
     -p 9000:9000 \
     -p 9001:9001 \
     -v minio_data:/data \
     -e MINIO_ROOT_USER=minioadmin \
     -e MINIO_ROOT_PASSWORD=minioadmin \
     minio/minio server /data --console-address ":9001"
   ```

2. **Configure environment:**
   ```bash
   S3_ENDPOINT=http://localhost:9000
   S3_ACCESS_KEY=minioadmin
   S3_SECRET_KEY=minioadmin
   S3_BUCKET=fixit-attachments
   ```

3. **Create bucket:**
   ```bash
   bun run minio:setup
   ```

### Option 3: DigitalOcean Spaces

```bash
S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
S3_REGION=nyc3
S3_BUCKET=your-space-name
S3_ACCESS_KEY=your-spaces-key
S3_SECRET_KEY=your-spaces-secret
```

---

## Building the Application

### Prerequisites

```bash
# Install dependencies
bun install --frozen-lockfile

# Or with npm
npm ci
```

### Type Check

```bash
bun run build:check
```

### Production Build

```bash
bun run build
```

This creates an optimized production build in `.next/`.

### Verify Build

```bash
# Check build output exists
ls -la .next/

# Test production server locally
bun run start
```

---

## Deployment Options

### Option 1: Direct Node.js

```bash
# Set environment
export NODE_ENV=production
export SESSION_SECRET=your-secret

# Build
bun run build

# Start server (port 3000)
bun run start

# Or specify port
PORT=8080 bun run start
```

### Option 2: Process Manager (PM2)

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start npm --name "fixit" -- start

# Save process list
pm2 save

# Setup startup script
pm2 startup
```

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'fixit',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

### Option 3: Docker

**Dockerfile:**
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json bun.lockb ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
```

**Build and run:**
```bash
docker build -t fixit-cmms .

docker run -d \
  --name fixit \
  -p 3000:3000 \
  -e SESSION_SECRET=your-secret \
  -e DATABASE_URL=file:/data/fixit.db \
  -e S3_ENDPOINT=https://s3.amazonaws.com \
  -v fixit-data:/data \
  fixit-cmms
```

### Option 4: Docker Compose

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - SESSION_SECRET=${SESSION_SECRET}
      - DATABASE_URL=file:/data/fixit.db
      - S3_ENDPOINT=http://minio:9000
      - S3_ACCESS_KEY=minioadmin
      - S3_SECRET_KEY=minioadmin
      - S3_BUCKET=fixit-attachments
    volumes:
      - fixit-data:/data
    depends_on:
      minio:
        condition: service_healthy

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      - MINIO_ROOT_USER=minioadmin
      - MINIO_ROOT_PASSWORD=minioadmin
    volumes:
      - minio-data:/data
    healthcheck:
      test: ["CMD", "mc", "ready", "local"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  fixit-data:
  minio-data:
```

**Run:**
```bash
docker-compose up -d
```

### Option 5: Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name fixit.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name fixit.example.com;

    ssl_certificate /etc/letsencrypt/live/fixit.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/fixit.example.com/privkey.pem;

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

---

## Post-Deployment

### Deployment Checklist

**Before deploying:**
- [ ] Generate new `SESSION_SECRET`
- [ ] Configure production S3 credentials
- [ ] Set `NODE_ENV=production`
- [ ] Set `LOG_LEVEL=info`
- [ ] Prepare database backup strategy

**During deployment:**
- [ ] Install dependencies: `bun install --frozen-lockfile`
- [ ] Run type check: `bun run build:check`
- [ ] Initialize database: `bun run db:push`
- [ ] Build application: `bun run build`

**After deployment:**
- [ ] Verify health endpoint: `GET /api/health`
- [ ] Test login functionality
- [ ] Verify attachment uploads work
- [ ] Set up log monitoring
- [ ] Configure health checks for load balancer

### Create Admin User

After initial deployment, seed data or create an admin user:

```bash
# Option 1: Run seed script (creates demo data)
bun run db:seed

# Option 2: Use the API (after seeding at least one admin)
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: TOKEN" \
  -d '{
    "name": "Admin User",
    "employeeId": "ADMIN001",
    "pin": "1234",
    "roleId": "admin-role-id"
  }'
```

### Setup Scheduler

The maintenance scheduler generates work orders for preventive maintenance:

```bash
# Trigger manually
curl -X POST http://localhost:3000/api/scheduler/run \
  -H "x-cron-secret: your-cron-secret"

# Setup cron job (daily at midnight)
0 0 * * * curl -X POST http://localhost:3000/api/scheduler/run \
  -H "x-cron-secret: your-cron-secret"
```

---

## Monitoring

### Health Check Endpoint

**Endpoint:** `GET /api/health`

**Response (healthy):**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00Z",
  "database": {
    "status": "connected",
    "latency_ms": 5
  },
  "memory": {
    "heap_used_mb": 150,
    "heap_total_mb": 256
  },
  "uptime_seconds": 86400
}
```

**Response (unhealthy - HTTP 503):**
```json
{
  "status": "unhealthy",
  "error": "Database connection failed"
}
```

### Load Balancer Health Check

Configure your load balancer to check:
- **Path:** `/api/health`
- **Interval:** 30 seconds
- **Timeout:** 10 seconds
- **Healthy threshold:** 2
- **Unhealthy threshold:** 3

### Logging

FixIt uses Pino for structured logging:

**Development (human-readable):**
```
[10:30:00] INFO: Server started on port 3000
[10:30:05] INFO: Database connected
```

**Production (JSON):**
```json
{"level":30,"time":1705312200000,"msg":"Server started","port":3000}
```

**Log modules:**
- `auth` - Authentication events
- `db` - Database operations
- `api` - API requests
- `inventory` - Inventory operations
- `workOrder` - Work order operations
- `scheduler` - Maintenance scheduler

### Metrics to Monitor

| Metric | Warning Threshold | Critical Threshold |
|--------|------------------|-------------------|
| Memory heap | > 500 MB | > 800 MB |
| Response time | > 500 ms | > 2000 ms |
| Error rate | > 1% | > 5% |
| Database latency | > 100 ms | > 500 ms |

---

## Troubleshooting

### Application Won't Start

**Check logs:**
```bash
# PM2
pm2 logs fixit

# Docker
docker logs fixit

# Direct
cat /var/log/fixit/error.log
```

**Common issues:**
- Missing `SESSION_SECRET`
- Database file not writable
- Port already in use

### Database Errors

**Schema mismatch:**
```bash
# Regenerate schema
bun run db:push
```

**Permission issues:**
```bash
# Check file permissions
ls -la /data/fixit.db
chmod 644 /data/fixit.db
```

**Corruption:**
```bash
# Check integrity
sqlite3 /data/fixit.db "PRAGMA integrity_check;"

# Restore from backup
cp /backups/fixit-latest.db /data/fixit.db
```

### S3/Attachment Errors

**Connection refused:**
- Verify `S3_ENDPOINT` is correct
- Check network connectivity to S3

**Access denied:**
- Verify credentials are correct
- Check bucket policy allows access

**Test connectivity:**
```bash
# Using AWS CLI
aws s3 ls s3://your-bucket --endpoint-url=http://your-endpoint
```

### Authentication Issues

**Users can't log in:**
- Check `SESSION_SECRET` hasn't changed
- Verify user exists and is active
- Check for account lockout (15 min after 5 failed attempts)

**Sessions expiring:**
- Check `SESSION_MAX_AGE` setting
- Verify server time is correct

### Performance Issues

**High memory usage:**
```bash
# Check current usage
curl http://localhost:3000/api/health | jq '.memory'

# Restart application
pm2 restart fixit
```

**Slow database:**
- Check database file size
- Consider archiving old work orders
- Verify indexes are present

---

## Security Considerations

### Security Headers

FixIt sets these headers automatically:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy: default-src 'self'`

### Rate Limiting

- Login: 5 attempts per minute
- Account lockout: 15 minutes after 5 failures
- API endpoints: Standard rate limits apply

### CSRF Protection

All mutating API endpoints require `x-csrf-token` header.

### Secrets Management

Never commit secrets to version control:
- Use environment variables
- Use secrets management (Vault, AWS Secrets Manager)
- Rotate secrets periodically

---

## Upgrading

### Standard Upgrade

```bash
# Pull latest code
git pull origin main

# Install dependencies
bun install

# Run migrations
bun run db:push

# Rebuild
bun run build

# Restart
pm2 restart fixit
```

### Docker Upgrade

```bash
# Pull new image
docker pull fixit-cmms:latest

# Stop current container
docker stop fixit

# Remove old container
docker rm fixit

# Start new container
docker run -d --name fixit ... fixit-cmms:latest
```

### Database Migrations

Always backup before running migrations:
```bash
cp /data/fixit.db /backups/fixit-pre-upgrade.db
bun run db:push
```

---

## Support

For issues:
1. Check application logs
2. Review this troubleshooting guide
3. Check GitHub issues for known problems
4. Open a new issue with logs and environment details
