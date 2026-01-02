# FixIt CMMS

A lightweight, self-hosted Computerized Maintenance Management System (CMMS) for tracking machine maintenance requests in manufacturing environments.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?style=flat-square&logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

## Features

- **Work Order Management** - Create, assign, and track maintenance requests with SLA-based priority levels
- **Equipment Tracking** - Manage machinery inventory with QR code integration for quick access
- **Preventive Maintenance** - Schedule recurring maintenance with customizable checklists
- **Inventory Management** - Track spare parts, stock levels, and consumption per work order
- **Labor Tracking** - Log technician time with billable hours support
- **Analytics Dashboard** - Real-time KPIs, MTTR, and SLA compliance metrics
- **Permission-Based Access** - Customizable roles with granular `resource:action` permissions
- **PWA Support** - Mobile-friendly with offline capabilities
- **Industrial Design** - Modern UI with dark mode and status-aware theming

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 15 with App Router (React 19) |
| **Language** | TypeScript (strict mode) |
| **Database** | SQLite/LibSQL with Drizzle ORM |
| **Styling** | Tailwind CSS 4 + Radix UI primitives |
| **Storage** | S3/MinIO for file attachments |
| **Auth** | JWT sessions with PIN-based login + CSRF protection |
| **Testing** | Vitest (unit) + Playwright (e2e) |
| **Linting** | Biome |

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) (recommended) or Node.js 18+
- Docker (for MinIO storage)

### Installation

```bash
# Clone and install dependencies
git clone <repository-url>
cd fixit-app
bun install

# Copy environment file
cp .env.example .env

# Generate a session secret (add to .env)
openssl rand -base64 32

# Start MinIO storage
docker-compose up -d
bun run minio:setup

# Initialize database
bun run db:push
bun run db:seed

# Start development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Default Login Credentials

| Role     | Employee ID | PIN  |
|----------|-------------|------|
| Admin    | ADMIN-001   | 1234 |
| Tech     | TECH-001    | 5678 |
| Operator | OP-001      | 0000 |

## Environment Variables

```bash
# Database
DATABASE_URL=file:./data/local.db

# Session (REQUIRED - must be 32+ characters)
SESSION_SECRET=your-secret-key-here-must-be-at-least-32-chars
SESSION_MAX_AGE=86400

# S3/MinIO Storage
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_BUCKET=fixit-attachments
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin

# Scheduler (for cron jobs)
CRON_SECRET=your-cron-secret-here
```

> ⚠️ **Important:** `SESSION_SECRET` is required in all environments. Generate with `openssl rand -base64 32`

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start dev server with Turbopack |
| `bun run build` | Build for production |
| `bun run build:check` | TypeScript compilation check |
| `bun run start` | Start production server |
| `bun run test` | Run unit tests (watch mode) |
| `bun run test:run` | Run unit tests once |
| `bun run e2e` | Run Playwright e2e tests |
| `bun run e2e:ui` | Open Playwright UI |
| `bun run lint` | Check code with Biome |
| `bun run lint:fix` | Auto-fix lint issues |
| `bun run db:push` | Push schema to database |
### Database Access

To access the database studio:

```bash
bun db:studio
```

### Remote Access (Tunnel)

Since automatic tunneling tools like `untun` are blocked by the firewall in this environment, use the provided SSH tunnel script:

```bash
npm run tunnel
# or
./scripts/tunnel.sh
```

This will generate a public URL (via serveo.net) that you can share.
| `bun run db:seed` | Seed development data |
| `bun run db:studio` | Open Drizzle Studio |

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Login page
│   ├── (main)/            # Main authenticated routes
│   │   ├── admin/         # Admin panel (users, roles, settings)
│   │   ├── dashboard/     # Technician dashboard
│   │   ├── maintenance/   # Work orders, schedules
│   │   ├── assets/        # Equipment management
│   │   ├── analytics/     # KPIs and reports
│   │   └── reports/       # Export and reporting
│   ├── (operator)/        # Simplified operator interface
│   ├── equipment/         # QR code scanner routes
│   └── api/               # REST API endpoints
├── actions/               # Server actions (mutations)
├── components/            
│   ├── ui/               # Reusable UI primitives
│   ├── layout/           # Header, sidebar, navigation
│   ├── dashboard/        # Dashboard-specific components
│   ├── work-orders/      # Work order components
│   └── ...               # Feature components
├── db/
│   ├── schema.ts         # Drizzle ORM schema (844 lines)
│   ├── index.ts          # Database client
│   └── seed.ts           # Development seed data
├── lib/
│   ├── session.ts        # JWT session management
│   ├── auth.ts           # Auth utilities (PIN, lockout)
│   ├── permissions.ts    # Permission constants and helpers
│   ├── rate-limit.ts     # API rate limiting
│   ├── sla.ts            # SLA calculations
│   ├── s3.ts             # S3/MinIO client
│   └── validations/      # Zod schemas
├── hooks/                 # React hooks
├── tests/                 # Unit tests
└── middleware.ts          # Auth middleware
e2e/                       # Playwright e2e tests
```

## Data Model

### Core Entities

| Entity | Description |
|--------|-------------|
| **Users** | Employees assigned to customizable roles |
| **Roles** | Permission sets with granular access control |
| **Equipment** | Machinery with status tracking and QR codes |
| **Equipment Models** | Reusable equipment templates with BOMs |
| **Locations** | Hierarchical facility structure |
| **Work Orders** | Maintenance requests with SLA tracking |
| **Maintenance Schedules** | Recurring preventive maintenance with checklists |
| **Spare Parts** | Inventory with reorder points and location tracking |
| **Labor Logs** | Time tracking per work order |
| **Attachments** | Photos/documents linked to any entity |

### Work Order Workflow

```
Open → In Progress → Resolved → Closed
```

### Work Order Types

`breakdown` • `maintenance` • `calibration` • `safety` • `upgrade`

### SLA Response Times

| Priority | Response Time |
|----------|---------------|
| Critical | 2 hours |
| High     | 8 hours |
| Medium   | 24 hours |
| Low      | 72 hours |

### Permission System

Permissions follow the `resource:action` pattern (e.g., `ticket:create`, `equipment:update`).
Administrators can create custom roles with any combination of permissions.

| Resource | Available Actions |
|----------|-------------------|
| ticket | create, view, view_all, update, resolve, close, assign |
| equipment | view, create, update, delete, manage_models |
| location | view, create, update, delete |
| user | view, create, update, delete |
| inventory | view, create, update, delete, receive_stock, use_parts |
| maintenance | view, create, update, delete, complete_checklist |
| analytics | view |
| reports | view, export |
| system | settings, qr_codes, scheduler |

Special permission `*` grants all permissions (superadmin).

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | PIN authentication |
| `/api/auth/logout` | POST | End session |
| `/api/auth/me` | GET | Current user info |
| `/api/equipment` | GET | List equipment |
| `/api/equipment/[id]` | GET | Equipment details |
| `/api/work-orders` | GET/POST | Work orders CRUD |
| `/api/analytics/kpis` | GET | Dashboard KPIs |
| `/api/inventory/parts` | GET | Spare parts list |
| `/api/attachments/presigned-url` | POST | Get S3 upload URL |
| `/api/scheduler/run` | POST | Trigger maintenance scheduler |

All mutating endpoints require CSRF token in `x-csrf-token` header.

## Security Features

- **JWT Sessions** - HttpOnly cookies with configurable expiry
- **CSRF Protection** - Token-based protection for all mutations
- **Rate Limiting** - Configurable limits per endpoint (5/min for login)
- **Account Lockout** - 15-minute lockout after 5 failed login attempts
- **Security Headers** - CSP, X-Frame-Options, etc. configured in `next.config.ts`
- **Permission Checks** - Server-side enforcement on all actions

## Testing

### Unit Tests

```bash
bun run test        # Watch mode
bun run test:run    # Single run
```

### E2E Tests

```bash
bun run e2e         # Headless
bun run e2e:ui      # Interactive UI
```

## Deployment

1. Set production environment variables (especially `SESSION_SECRET`)
2. Run database migrations: `bun run db:push`
3. Build: `bun run build`
4. Start: `bun run start`

For file storage, configure S3-compatible storage (AWS S3, MinIO, DigitalOcean Spaces, etc.).

### Docker Deployment

```bash
# Production with external S3
docker build -t fixit-cmms .
docker run -p 3000:3000 \
  -e DATABASE_URL=/data/local.db \
  -e SESSION_SECRET=your-secret \
  -e S3_ENDPOINT=https://s3.amazonaws.com \
  -v fixit-data:/data \
  fixit-cmms
```

## Development

### For AI Agents

See [AGENTS.md](./AGENTS.md) for detailed coding conventions, patterns, and guidelines.

### Current Status

We are currently in active development. Check out our [Roadmap](./ROADMAP.md) and [Issues](https://github.com/0xForelsket/fixit-app/issues) to see what we're working on.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Run linting: `bun run lint:fix`
4. Run tests: `bun run test:run`
5. Commit changes (`git commit -m 'Add amazing feature'`)
6. Push to branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

MIT License. Copyright (c) 2025 0xForelsket.
