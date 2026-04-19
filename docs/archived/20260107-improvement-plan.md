  🔴 High Priority Improvements

  Security Fixes

  | Issue                               | Location                             | Impact                                        |
  |-------------------------------------|--------------------------------------|-----------------------------------------------|
  | ✅ Logout missing CSRF protection      | /api/auth/logout                     | Vulnerable to cross-site logout attacks       |
  | ✅ In-memory rate limiting won't scale | src/lib/rate-limit.ts                | Fails in load-balanced/serverless deployments |
  | ✅ Weak encryption key derivation      | src/lib/encryption.ts                | Uses simple buffer copy instead of PBKDF2     |
  | ✅ No rate limiting on expensive GETs  | /api/search/global, /api/analytics/* | DoS vulnerability                             |
  | ✅ CSRF missing on notifications POST  | /api/notifications                   | Security gap                                  |

  Database Constraints

  - Add CHECK constraint: inventoryLevels.quantity >= 0
  - Add CHECK constraint: meterReadings.reading >= 0
  - Add unique constraint: equipmentMeters(equipmentId, name)
  - Add index on workOrders.createdAt for time-range queries

  ---
  🟠 Feature Additions

  API Enhancements

  1. Sorting & filtering parameters - Add ?sort=field&order=asc to list endpoints
  2. Bulk operations - Bulk update/delete for work orders, equipment, inventory
  3. API versioning - Add /api/v1/ prefix for breaking change management
  4. Webhooks/events - Allow external systems to subscribe to work order changes
  5. Export streaming - CSV/JSON streaming for large datasets

  Analytics Improvements

  1. ✅ Date range filtering - KPIs currently hardcoded to 30 days
  2. ✅ Technician/user filtering - Filter analytics by specific users
  3. Equipment utilization metrics - OEE calculations
  4. ✅ Predictive maintenance dashboard - Leverage existing equipmentPredictions table

  UI Features

  1. Dark mode persistence - Theme already supported, ensure persistence
  2. Keyboard shortcuts - Power user navigation
  3. Drag-and-drop work order assignment - Visual scheduling
  4. Real-time updates - Expand SSE beyond notifications

  ---
  🟡 Optimizations

  Performance

  | Area                  | Current                               | Recommendation                        |
  |-----------------------|---------------------------------------|---------------------------------------|
  | Dashboard queries     | 3-4 joins for equipment+type+category | Materialized view for pre-joined data |
  | Downtime calculations | Calculated at query time              | Add cached durationMinutes column     |
  | Cache headers         | Only on analytics routes              | Add to all list endpoints             |
  | Revalidation          | Broad revalidatePath("/") calls       | Use revalidateTag() for granularity   |

  Code Deduplication

  src/actions/work-orders/
  ├── create.ts, update.ts, resolve.ts, bulk.ts, quick-actions.ts
  │   └── All revalidate identical paths 15+ times
  │   └── Extract: revalidateWorkOrderPaths() utility

  Permission checks repeated in every action:
  │   └── Standardize on requirePermission() vs manual checks

  FormData extraction pattern repeated:
  │   └── Extract typed form parser helpers

  API Response Standardization

  - Inconsistent keys: { notifications: [...] } vs { data: [...] }
  - Standardize on { data: T, requestId?: string, pagination?: ... }

  ---
  🔵 Architectural Shifts

  1. ✅ Redis for Rate Limiting (Critical for Production)

  // Current: In-memory Map (single instance only)
  // Proposed: Redis adapter
  interface RateLimitProvider {
    check(key: string, limit: number, windowMs: number): Promise<RateLimitResult>;
  }

  2. Event-Driven Architecture

  Current: Direct DB writes + revalidatePath
  Proposed: Event bus for cross-cutting concerns

  WorkOrderCreated →
    ├── NotificationService.notify()
    ├── AuditService.log()
    ├── AnalyticsService.updateMetrics()
    └── WebhookService.dispatch()

  3. Query/Command Separation

  Current: Mixed query/mutation patterns in actions
  Proposed:
    - src/actions/commands/ (mutations with ActionResult<T>)
    - src/actions/queries/ (reads with QueryResult<T>)

  4. Pre-aggregated Metrics Table

  -- For dashboard performance at scale
  CREATE TABLE daily_metrics (
    date DATE PRIMARY KEY,
    work_orders_created INT,
    work_orders_resolved INT,
    avg_resolution_time_hours DECIMAL,
    downtime_minutes INT,
    -- Updated by trigger or cron
  );

  5. Middleware Consolidation

  // Extract repeated patterns into middleware
  export function withAuth<T>(handler: AuthenticatedHandler<T>) {
    return async (req: Request) => {
      const requestId = generateRequestId();
      await requireCsrf(req);
      const rateLimit = checkRateLimit(...);
      if (!rateLimit.success) return ApiErrors.rateLimited(...);
      const user = await getCurrentUser();
      if (!user) return ApiErrors.unauthorized(requestId);
      return handler(req, user, requestId);
    };
  }

  ---
  🟢 Developer Experience

  CI/CD Pipeline (Missing)

  # .github/workflows/ci.yml
  - bun run lint
  - bun run build:check
  - bun run test:run
  - playwright test (on PR)
  - Coverage reporting to Codecov

  Testing Gaps

  | Missing                         | Priority |
  |---------------------------------|----------|
  | Component tests (~50+ untested) | Medium   |
  | Accessibility tests (axe)       | Medium   |
  | Integration tests (API+DB)      | Medium   |
  | Security tests (CSRF, XSS)      | High     |
  | i18n locale tests               | Low      |

  Documentation

  - Add JSDoc to all public action exports
  - Document the excellent FilterBar pattern
  - ✅ Create Storybook for design system

  ---
  📊 Summary Scorecard

  | Area                 | Current | Target |
  |----------------------|---------|--------|
  | Security             | 7.5/10  | 9/10   |
  | API Consistency      | 8/10    | 9.5/10 |
  | Database Design      | 9/10    | 9.5/10 |
  | UI Architecture      | 9.5/10  | 9.5/10 |
  | Test Coverage        | 7/10    | 9/10   |
  | Code Duplication     | 8/10    | 9.5/10 |
  | Production Readiness | 7/10    | 9/10   |

  ---
  🎯 Recommended Implementation Order

  1. Week 1: Security fixes (CSRF, rate limiting, encryption)
  2. Week 2: API standardization + cache headers
  3. Week 3: CI/CD pipeline + test coverage expansion
  4. Week 4: Code deduplication (shared utilities)
  5. Ongoing: Feature additions based on user feedback