# FixIt CMMS

A lightweight, self-hosted Computerized Maintenance Management System (CMMS) for tracking machine maintenance requests in manufacturing environments.

## Features

- **Ticket Management** - Create, assign, and track maintenance requests with SLA-based priority levels
- **Equipment Tracking** - Manage machinery inventory with QR code integration for quick access
- **Preventive Maintenance** - Schedule recurring maintenance with checklists
- **Inventory Management** - Track spare parts, stock levels, and consumption
- **Labor Tracking** - Log technician time with billable hours support
- **Analytics Dashboard** - Real-time KPIs, MTTR, and SLA compliance metrics
- **Permission-Based Access** - Customizable roles with granular permissions
- **PWA Support** - Mobile-friendly with offline capabilities

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: SQLite with Drizzle ORM
- **UI**: Tailwind CSS 4 + Radix UI + Shadcn components
- **Storage**: S3/MinIO for file attachments
- **Auth**: JWT sessions with PIN-based login
- **Testing**: Vitest (unit) + Playwright (e2e)

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) (or Node.js 18+)
- Docker (for MinIO storage)

### Installation

```bash
# Clone and install dependencies
git clone <repository-url>
cd fixit-app
bun install

# Copy environment file
cp .env.example .env

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

# Session (use 32+ character secret in production)
SESSION_SECRET=your-secret-key-here-must-be-at-least-32-chars
SESSION_MAX_AGE=86400

# S3/MinIO Storage
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_BUCKET=fixit-attachments
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin

# Scheduler
CRON_SECRET=your-cron-secret-here
```

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start dev server with Turbopack |
| `bun run build` | Build for production |
| `bun run start` | Start production server |
| `bun run test` | Run unit tests (watch mode) |
| `bun run test:run` | Run unit tests once |
| `bun run e2e` | Run Playwright e2e tests |
| `bun run e2e:ui` | Open Playwright UI |
| `bun run lint` | Check code with Biome |
| `bun run lint:fix` | Auto-fix lint issues |
| `bun run db:push` | Push schema to database |
| `bun run db:seed` | Seed development data |
| `bun run db:studio` | Open Drizzle Studio |

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Login page
│   ├── (operator)/        # Operator interface
│   ├── (tech)/dashboard/  # Technician dashboard
│   ├── (admin)/admin/     # Admin panel
│   └── api/               # API routes
├── actions/               # Server actions
├── components/            # React components
│   ├── ui/               # Shadcn UI primitives
│   ├── layout/           # Header, sidebar, nav
│   └── ...               # Feature components
├── db/
│   ├── schema.ts         # Drizzle ORM schema
│   ├── index.ts          # Database client
│   └── seed.ts           # Seed data
├── lib/
│   ├── auth.ts           # Authentication utils
│   ├── permissions.ts    # Permission constants and helpers
│   ├── session.ts        # JWT session management
│   ├── sla.ts            # SLA calculations
│   ├── s3.ts             # S3/MinIO client
│   └── validations/      # Zod schemas
├── tests/                # Unit tests
└── middleware.ts         # Auth middleware
e2e/                       # Playwright tests
```

## Data Model

### Core Entities

- **Users** - Employees assigned to customizable roles
- **Roles** - Permission sets (e.g., operator, technician, admin, or custom)
- **Equipment** - Machinery with status tracking and QR codes
- **Locations** - Hierarchical facility structure
- **Tickets** - Maintenance requests with SLA tracking
- **Maintenance Schedules** - Recurring preventive maintenance
- **Spare Parts** - Inventory with reorder points
- **Labor Logs** - Time tracking per ticket

### Ticket Workflow

```
Open → In Progress → Resolved → Closed
```

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

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/login` | PIN authentication |
| `GET /api/equipment` | List equipment |
| `POST /api/tickets` | Create ticket |
| `GET /api/analytics/kpis` | Dashboard KPIs |
| `GET /api/inventory/parts` | Spare parts list |
| `POST /api/attachments/presigned-url` | Get upload URL |

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

1. Set production environment variables
2. Run database migrations: `bun run db:push`
3. Build: `bun run build`
4. Start: `bun run start`

For file storage, configure S3-compatible storage (AWS S3, MinIO, etc.) with appropriate credentials.

## License

MIT
