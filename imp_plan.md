# UI/UX Implementation Plan

> Generated: 2025-12-27  
> Status: **Phase 0 Complete** ✅

---

## Executive Summary

This document captures the current state analysis and prioritized implementation plan for UI/UX improvements to the FixIt CMMS application.

**Key Finding**: User management pages (create/edit) already exist with a visual role card selector. The original assessment was outdated.

**Phase 0 Completed**: Permission descriptions, dashboard personalization, and PWA setup are now implemented.

---

## Current State Analysis

### Already Implemented

| Feature | Status | Location | Notes |
|---------|--------|----------|-------|
| User List Page | ✅ Complete | `src/app/(admin)/admin/users/page.tsx` | Stats cards, search/filter, data table |
| User Create Page | ✅ Complete | `src/app/(admin)/admin/users/new/page.tsx` | Uses shared UserForm component |
| User Edit Page | ✅ Complete | `src/app/(admin)/admin/users/[id]/page.tsx` | Uses shared UserForm component |
| UserForm Component | ✅ Complete | `src/app/(admin)/admin/users/user-form.tsx` | Visual role card selector with permission counts |
| Delete User | ✅ Complete | `src/app/(admin)/admin/users/delete-user-button.tsx` | Soft delete (deactivation) |
| User Server Actions | ✅ Complete | `src/actions/users.ts` | Full CRUD: getUsers, getUserById, createUser, updateUser, deleteUser, getAllRoles |
| User Validation | ✅ Complete | `src/lib/validations/users.ts` | createUserSchema, updateUserSchema |
| Role Management | ✅ Complete | `src/app/(admin)/admin/roles/*` | List, create, edit, delete |
| RoleForm Component | ✅ Complete | `src/app/(admin)/admin/roles/role-form.tsx` | Permission group checkboxes, "Grant All" toggle, **human-readable descriptions** |
| Permission System | ✅ Complete | `src/lib/permissions.ts` | 30+ permissions, helper functions |
| Permission Descriptions | ✅ **NEW** | `src/app/(admin)/admin/roles/role-form.tsx` | `PERMISSION_DESCRIPTIONS` map with human-readable text |
| Dashboard Personalization | ✅ **NEW** | `src/app/(tech)/dashboard/page.tsx` | Dual stats (My/System), My Queue section, celebratory empty state |
| My Tickets Filter | ✅ **NEW** | `src/app/(tech)/dashboard/tickets/page.tsx` | `?assigned=me` filter, All/Mine toggle |
| PWA Service Worker | ✅ **NEW** | `next.config.ts` | next-pwa configured, manifest enhanced |
| PWA Manifest | ✅ Complete | `public/manifest.json` | Full metadata with id, scope, orientation, categories |

### Not Implemented (Phases 1-3)

| Feature | Priority | Current State |
|---------|----------|---------------|
| Mobile Camera Integration | Medium | No "Take Photo" button |
| Voice-to-Text | Medium | No speech recognition for descriptions |
| Touch Target Optimization | Medium | Some buttons < 48px |
| Command Palette (Cmd+K) | Medium | Not implemented |
| Bottom Sheet Forms | Low | Standard modal/page forms only |

---

## Architecture Overview

### User Management Flow

```
/admin/users (list)
    ├── /admin/users/new (create) → UserForm → createUser action
    └── /admin/users/[id] (edit) → UserForm → updateUser action

UserForm component:
- Employee ID (readonly in edit mode)
- Full Name
- Email (optional)
- PIN (required for create, optional for edit)
- Hourly Rate (optional)
- Status toggle (Active/Inactive)
- Role Card Selector (visual grid with descriptions & permission counts)
```

### Role Management Flow

```
/admin/roles (list)
    ├── /admin/roles/new (create) → RoleForm → createRole action
    └── /admin/roles/[id] (edit) → RoleForm → updateRole action

RoleForm component:
- Role Name (lowercase, hyphens, underscores)
- Description
- "Grant All (Superadmin)" toggle
- Permission Groups (8 groups with individual checkboxes):
  - Tickets (7 permissions)
  - Equipment (5 permissions)
  - Locations (4 permissions)
  - Users (4 permissions)
  - Inventory (6 permissions)
  - Maintenance (5 permissions)
  - Analytics & Reports (3 permissions)
  - System (3 permissions)
```

### Dashboard Structure

```
/dashboard (technician main)
    ├── Stats: Open, In Progress, Overdue, Critical (global counts)
    ├── Priority Queue: 5 most recent open tickets (global)
    └── /dashboard/tickets (all tickets with filters)
        └── /dashboard/tickets/[id] (ticket detail)

/my-tickets (operator)
    └── Shows tickets REPORTED BY current user (not assigned to)
```

### PWA Status

```
public/manifest.json:
- name: "FixIt CMMS"
- short_name: "FixIt"
- display: "standalone"
- icons: 180x180, 512x512

Missing:
- Service worker (sw.js)
- next-pwa or workbox configuration
- Offline caching strategy
- Push notification support
```

---

## Implementation Plan

### Phase 0: Quick Wins ✅ COMPLETED

#### 0.1 Permission Descriptions ✅
**Status**: Complete  
**Files modified**:
- `src/app/(admin)/admin/roles/role-form.tsx` - Added `PERMISSION_DESCRIPTIONS` map with 30+ human-readable descriptions, updated UI to show description under each permission label

#### 0.2 Dashboard Personalization ✅
**Status**: Complete  
**Files modified**:
- `src/app/(tech)/dashboard/page.tsx` - Added dual stats (personal + global), "My Queue" section with assigned tickets, celebratory "All Caught Up!" empty state
- `src/app/(tech)/dashboard/tickets/page.tsx` - Added `?assigned=me` filter, All/Mine toggle button in header

#### 0.3 PWA Service Worker Setup ✅
**Status**: Complete  
**Files modified**:
- `next.config.ts` - Configured with `next-pwa` (require syntax for compat)
- `public/manifest.json` - Added `id`, `scope`, `orientation`, `categories`, icon purposes
- `package.json` - Added `next-pwa@5.6.0` dependency

**Note**: PWA meta tags already existed in `src/app/layout.tsx` via Next.js Metadata API.

---

### Phase 1: Mobile Operator Experience (1-2 Weeks)

#### 2.1 Camera Integration
**Location**: `src/app/(operator)/report/[code]/page.tsx`

```typescript
async function capturePhoto() {
  const stream = await navigator.mediaDevices.getUserMedia({ 
    video: { facingMode: 'environment' } 
  });
  // Capture frame, convert to blob, upload
}
```

**UI**: "Take Photo" button with camera icon, preview thumbnails

#### 2.2 Touch Target Optimization
- Audit all interactive elements
- Minimum 48x48px touch targets
- Add padding to small buttons/links
- Increase spacing between tappable items

**Files to audit**:
- `src/components/ui/button.tsx`
- `src/app/(operator)/**/*.tsx`

#### 2.3 Voice-to-Text
**Location**: Ticket description fields

```typescript
const recognition = new webkitSpeechRecognition();
recognition.continuous = false;
recognition.interimResults = true;

recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript;
  setDescription(prev => prev + ' ' + transcript);
};
```

**UI**: Microphone button next to textarea

#### 2.4 Bottom Sheet Forms (Mobile)
- Use CSS `position: fixed; bottom: 0` on mobile
- Keep equipment context visible above sheet
- Swipe-to-dismiss gesture

---

### Phase 3: Command Palette (3-5 Days)

#### 3.1 Global Keyboard Shortcut
```typescript
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setOpen(true);
    }
  };
  document.addEventListener('keydown', handler);
  return () => document.removeEventListener('keydown', handler);
}, []);
```

#### 3.2 Search Index
- Equipment: by ID, name, location
- Tickets: by ID, title, equipment name
- Pages: static list of routes
- Users: by name, employee ID

#### 3.3 Quick Actions
- "Create Ticket" → `/report`
- "Scan QR" → Camera modal
- "Go to Dashboard" → `/dashboard`

#### 3.4 Glass & Industrial Design
```css
.command-palette {
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.command-item {
  font-family: 'JetBrains Mono', monospace;
}

.command-item:focus {
  background: rgba(249, 115, 22, 0.2); /* orange highlight */
}
```

---

## File Reference

### User Management
| File | Purpose |
|------|---------|
| `src/app/(admin)/admin/users/page.tsx` | User list with stats, search, filter |
| `src/app/(admin)/admin/users/new/page.tsx` | Create user page |
| `src/app/(admin)/admin/users/[id]/page.tsx` | Edit user page |
| `src/app/(admin)/admin/users/user-form.tsx` | Shared form component with role cards |
| `src/app/(admin)/admin/users/delete-user-button.tsx` | Deactivation button |
| `src/actions/users.ts` | Server actions for CRUD |
| `src/lib/validations/users.ts` | Zod schemas |

### Role Management
| File | Purpose |
|------|---------|
| `src/app/(admin)/admin/roles/page.tsx` | Role list |
| `src/app/(admin)/admin/roles/new/page.tsx` | Create role page |
| `src/app/(admin)/admin/roles/[id]/page.tsx` | Edit role page |
| `src/app/(admin)/admin/roles/role-form.tsx` | Shared form with permission checkboxes |
| `src/app/(admin)/admin/roles/delete-role-button.tsx` | Delete button |
| `src/actions/roles.ts` | Server actions |
| `src/lib/validations/roles.ts` | Zod schemas |
| `src/lib/permissions.ts` | Permission constants and helpers |

### Dashboard
| File | Purpose |
|------|---------|
| `src/app/(tech)/dashboard/page.tsx` | Main dashboard with stats |
| `src/app/(tech)/dashboard/tickets/page.tsx` | All tickets with filters |
| `src/app/(tech)/dashboard/layout.tsx` | Auth check, user context |
| `src/app/(operator)/my-tickets/page.tsx` | Operator's reported tickets |

### PWA
| File | Purpose |
|------|---------|
| `public/manifest.json` | PWA metadata |
| `next.config.ts` | Build configuration |
| `src/app/layout.tsx` | Root layout with meta tags |

---

## Dependencies to Add

| Package | Version | Purpose |
|---------|---------|---------|
| `next-pwa` | ^5.6.0 | Service worker generation |
| `cmdk` | ^1.0.0 | Command palette component (optional) |

---

## Testing Checklist

### User Management
- [ ] Create user with all fields
- [ ] Create user with minimum required fields
- [ ] Edit user name, email, hourly rate
- [ ] Change user role via card selector
- [ ] Toggle user active/inactive
- [ ] Attempt to change employee ID (should be disabled)
- [ ] Delete/deactivate user
- [ ] Validation error handling

### Role Management
- [ ] Create role with custom permissions
- [ ] Edit role permissions
- [ ] "Grant All" toggle works correctly
- [ ] Cannot edit system roles
- [ ] Cannot delete role with assigned users
- [ ] Permission descriptions readable

### Dashboard Personalization
- [ ] Toggle between global and personal view
- [ ] Stats update correctly for each view
- [ ] "My Tickets" filter works
- [ ] Empty state shows when no assigned tickets
- [ ] Preference persists across sessions

### PWA
- [ ] Manifest loads correctly
- [ ] "Add to Home Screen" prompt appears
- [ ] App launches in standalone mode
- [ ] Offline fallback page works
- [ ] Static assets cached
- [ ] API calls work with cached fallback

---

## Next Steps

1. **Immediate**: Review this plan, prioritize based on team capacity
2. **Phase 0**: Start with permission descriptions (quick win, high visibility)
3. **Phase 0**: Implement dashboard personalization
4. **Phase 0**: Set up PWA with next-pwa
5. **Phase 1+**: Schedule based on sprint planning

---

## Changelog

| Date | Change |
|------|--------|
| 2025-12-27 | Initial plan created from codebase analysis |
