# Self-Hosting Deployment Guide (VPS)

Moving to a VPS (Standard Linux Server) is the best way to get performance and stability while keeping your current architecture (Postgres + MinIO) without complex cloud migrations.

## 1. Prerequisites
- **VPS**: A small instance (e.g., Hetzner CPX11, DigitalOcean Droplet, AWS Lightsail). 2GB RAM recommended.
- **Domain**: A domain name pointing to your VPS IP.

## 2. Infrastructure (Docker Compose)
Create a `docker-compose.yml` on your VPS to run all services together:

```yaml
version: '3.8'

services:
  # Next.js App
  app:
    image: ghcr.io/youruser/fixit-app:latest
    restart: always
    env_file: .env.production
    ports:
      - "3000:3000"
    depends_on:
      - db
      - minio

  # Database
  db:
    image: postgres:15-alpine
    restart: always
    volumes:
      - db_data:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: fixit
      POSTGRES_PASSWORD: securepassword
      POSTGRES_DB: fixit

  # File Storage
  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    restart: always
    volumes:
      - minio_data:/data
    environment:
      MINIO_ROOT_USER: admin
      MINIO_ROOT_PASSWORD: secureminiopassword

  # Reverse Proxy (Auto HTTPS)
  caddy:
    image: caddy:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config

volumes:
  db_data:
  minio_data:
  caddy_data:
  caddy_config:
```

## 3. Caddyfile (Reverse Proxy)
Create a `Caddyfile` to handle domains and SSL automatically:

```
yourdomain.com {
    reverse_proxy app:3000
}

files.yourdomain.com {
    reverse_proxy minio:9000
}
```

## 4. Deploy
1. Push your code to GitHub.
2. Build the Docker image (or build on the VPS).
3. Run `docker-compose up -d`.

This setup gives you:
- **Zero latency** (direct connection).
- **Real SSL** (no warnings).
- **Full control** over data and files.
