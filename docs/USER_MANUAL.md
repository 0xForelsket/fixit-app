# FixIt CMMS - User Manual

FixIt is a Computerized Maintenance Management System (CMMS) designed for manufacturing environments to streamline equipment maintenance operations.

## Table of Contents

1. [Getting Started](#getting-started)
2. [User Roles](#user-roles)
3. [Operator Guide](#operator-guide)
4. [Technician Guide](#technician-guide)
5. [Admin Guide](#admin-guide)
6. [Common Tasks](#common-tasks)

---

## Getting Started

### Logging In

1. Navigate to the FixIt application URL
2. Enter your **Employee ID** and **PIN** (provided by your administrator)
3. Click **Sign In**

> **Note:** After 5 failed login attempts, your account will be locked for 15 minutes.

### Navigation

The main navigation appears at the bottom of the screen (mobile) or in the sidebar (desktop):

- **Home** - Dashboard or equipment browser depending on your role
- **Work Orders** - View and manage maintenance requests
- **Assets** - Equipment, inventory, and locations
- **Analytics** - Performance metrics and reports (admin/technician)
- **Admin** - User and role management (admin only)

---

## User Roles

FixIt uses three primary roles with different capabilities:

| Role | Purpose | Key Capabilities |
|------|---------|------------------|
| **Operator** | Shop floor workers | Report issues, view own tickets |
| **Technician** | Maintenance staff | Resolve work orders, manage inventory, log time |
| **Admin** | System management | All capabilities plus user/role management |

Your administrator may have created custom roles with specific permissions.

---

## Operator Guide

As an Operator, your primary tasks are reporting equipment issues and tracking your submitted requests.

### Reporting an Issue

**Method 1: Scan QR Code**
1. Use your device's camera to scan the equipment's QR code
2. You'll be taken directly to the issue report form for that equipment
3. Describe the problem, select priority, and submit

**Method 2: Browse Equipment**
1. From the Home page, browse or search for equipment
2. Click on the equipment card
3. Click **Report Issue**
4. Fill in the issue details and submit

### Issue Report Form Fields

| Field | Description |
|-------|-------------|
| **Title** | Brief description of the problem |
| **Description** | Detailed explanation of what's wrong |
| **Priority** | How urgent is this? (Low, Medium, High, Critical) |
| **Type** | Category: Breakdown, Maintenance, Calibration, Safety, Upgrade |
| **Attachments** | Optional photos or documents |

### Priority Levels

| Priority | Response Time | When to Use |
|----------|---------------|-------------|
| **Low** | 72 hours | Minor issues, cosmetic problems |
| **Medium** | 24 hours | Equipment degraded but functional |
| **High** | 8 hours | Equipment significantly impaired |
| **Critical** | 2 hours | Equipment down, safety risk, production stopped |

### Tracking Your Tickets

1. Go to **My Tickets** from the navigation
2. View all tickets you've submitted
3. Click on any ticket to see updates, status changes, and resolution notes

### Work Order Statuses

| Status | Meaning |
|--------|---------|
| **Open** | Submitted, awaiting assignment |
| **In Progress** | Technician is working on it |
| **Resolved** | Work completed, awaiting verification |
| **Closed** | Fully completed and closed |

---

## Technician Guide

As a Technician, you handle maintenance tasks, manage equipment, and track inventory.

### Dashboard Overview

Your dashboard shows:
- **Open Work Orders** - Tickets awaiting action
- **Overdue Orders** - Past their SLA deadline
- **Critical Issues** - Highest priority items
- **Work Order Feed** - Recent activity

### Managing Work Orders

#### Viewing Work Orders
1. Go to **Maintenance > Work Orders**
2. Use filters to find specific orders:
   - Status (Open, In Progress, Resolved, Closed)
   - Priority (Low, Medium, High, Critical)
   - Equipment
   - Assigned technician
3. Click any row to view details

#### Working on a Work Order
1. Open the work order detail page
2. Click **Start Work** to change status to "In Progress"
3. Add updates as you work (notes, photos)
4. Log your time using the Labor section
5. If parts are needed, add them from inventory
6. When complete, click **Mark Resolved**
7. Add resolution notes explaining what was done

#### Adding Updates
1. In the work order detail, scroll to the Updates section
2. Type your update in the text box
3. Optionally attach photos or documents
4. Click **Add Update**

### Equipment Management

#### Viewing Equipment
1. Go to **Assets > Equipment**
2. Filter by status, location, or category
3. Click on any equipment to see:
   - Current status
   - Specifications
   - Maintenance history
   - Associated work orders
   - Attached documents

#### Equipment Status
| Status | Color | Meaning |
|--------|-------|---------|
| **Operational** | Green | Running normally |
| **Down** | Red | Not functioning |
| **Maintenance** | Yellow | Undergoing scheduled maintenance |

### Inventory Management

#### Viewing Parts
1. Go to **Assets > Inventory > Parts**
2. Browse the spare parts catalog
3. Each part shows:
   - SKU and name
   - Current stock level
   - Reorder point
   - Category and location

#### Using Parts for Work Orders
1. In a work order, go to the Parts section
2. Search for the part you need
3. Enter the quantity used
4. The system will deduct from inventory automatically

#### Receiving Stock
1. Go to **Assets > Inventory > Receive**
2. Select the part and location
3. Enter quantity received
4. Add notes (supplier, PO number, etc.)
5. Submit to update stock levels

### Time Tracking

#### Logging Labor Time
1. In a work order, go to the Labor section
2. Click **Add Labor Log**
3. Enter:
   - Duration (hours/minutes)
   - Hourly rate
   - Whether it's billable
   - Notes
4. Save the entry

### Preventive Maintenance

#### Viewing Schedules
1. Go to **Maintenance > Schedules**
2. View all preventive maintenance schedules
3. Each shows:
   - Equipment
   - Frequency (e.g., every 30 days)
   - Next due date
   - Checklist items

#### Completing a PM Checklist
1. Open the generated work order
2. Go to the Checklist section
3. Check off each item as completed
4. Add notes for any issues found
5. Mark the work order as resolved

---

## Admin Guide

Administrators have full system access plus user and role management.

### User Management

#### Viewing Users
1. Go to **Admin > Users**
2. View all users with their:
   - Name and Employee ID
   - Role
   - Status (Active/Inactive)
   - Last login

#### Creating a New User
1. Go to **Admin > Users**
2. Click **Add User**
3. Fill in:
   - Name
   - Employee ID (unique identifier)
   - PIN (4-6 digits for login)
   - Email (optional)
   - Role
4. Click **Create User**

#### Editing a User
1. Click on the user in the list
2. Update any fields
3. To reset their PIN, enter a new value
4. Click **Save Changes**

#### Deactivating a User
1. Open the user's profile
2. Toggle the **Active** switch to off
3. The user will no longer be able to log in

### Role Management

#### Default Roles
- **Operator** - Report issues, view own tickets
- **Technician** - Full work order and inventory access
- **Admin** - All permissions

#### Creating a Custom Role
1. Go to **Admin > Roles**
2. Click **Create Role**
3. Enter a role name and description
4. Use the permission builder to select capabilities:
   - **Tickets**: create, view, update, resolve, close, assign
   - **Equipment**: view, create, update, delete
   - **Inventory**: view, create, update, receive_stock, use_parts
   - **Maintenance**: view, create, update, complete_checklist
   - **Analytics**: view
   - **System**: settings, QR codes
5. Click **Create Role**

### Data Import

#### Bulk Import
1. Go to **Admin > Import**
2. Select the data type:
   - Users
   - Equipment
   - Locations
   - Spare Parts
3. Download the CSV template
4. Fill in your data
5. Upload the completed CSV
6. Review the preview
7. Confirm import

### System Settings

Access system configuration at **Admin > Settings**:
- Notification preferences
- SLA time windows
- Default values
- QR code settings

### QR Code Management

#### Generating QR Codes
1. Go to **Assets > QR Codes**
2. Select equipment to generate codes for
3. Choose format (PDF, individual images)
4. Download and print

---

## Common Tasks

### Searching for Equipment
1. Use the search bar on any equipment page
2. Search by:
   - Equipment name
   - Equipment code
   - Location
3. Results appear as you type

### Adding Attachments
1. Click the attachment icon or **Add Attachment**
2. Select a file (photos, documents, PDFs)
3. Supported formats: JPG, PNG, PDF, DOC
4. Files are uploaded to secure storage

### Viewing Notifications
1. Click the bell icon in the header
2. View unread notifications
3. Click any notification to go to the related item
4. Notifications include:
   - Work order assignments
   - Status changes
   - Overdue alerts
   - PM reminders

### Using Offline Mode
FixIt works offline for basic browsing:
1. Previously viewed equipment is cached
2. Work order lists remain accessible
3. New submissions queue until online
4. Sync happens automatically when connected

### Getting Help
- Contact your system administrator for access issues
- Use the in-app feedback option for suggestions
- Check the FAQ section for common questions

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `/` | Focus search bar |
| `Esc` | Close modals/dialogs |
| `Enter` | Submit forms |

---

## Troubleshooting

### Can't Log In
- Verify your Employee ID is correct
- Check that your PIN is entered correctly
- Wait 15 minutes if you've been locked out
- Contact admin if problems persist

### Missing Permissions
- You may not have access to certain features
- Contact your administrator to review your role

### Attachments Won't Upload
- Check file size (max 10MB)
- Verify file type is supported
- Ensure you have a stable internet connection

### Data Not Syncing
- Check your internet connection
- Refresh the page
- Log out and log back in
- Contact admin if issues persist

---

## Glossary

| Term | Definition |
|------|------------|
| **CMMS** | Computerized Maintenance Management System |
| **PM** | Preventive Maintenance |
| **SLA** | Service Level Agreement (response time target) |
| **MTTR** | Mean Time to Repair |
| **BOM** | Bill of Materials |
| **SKU** | Stock Keeping Unit |
| **Work Order** | A formal maintenance request |
