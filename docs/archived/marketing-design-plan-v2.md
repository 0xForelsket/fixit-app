# FixIt Marketing Site Design Plan v2

> A comprehensive strategy document for the FixIt CMMS marketing website.
> Last updated: January 2026

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Target Audience](#target-audience)
3. [Competitive Positioning](#competitive-positioning)
4. [Site Architecture](#site-architecture)
5. [Page Specifications](#page-specifications)
6. [Design System](#design-system)
7. [Content Strategy](#content-strategy)
8. [Technical Requirements](#technical-requirements)
9. [Implementation Roadmap](#implementation-roadmap)
10. [Success Metrics](#success-metrics)

---

## Executive Summary

### Vision
Position FixIt as the **definitive open-source CMMS** for organizations that demand data sovereignty, modern UX, and zero vendor lock-in. The marketing site should convey **industrial reliability** with **startup-grade design quality**.

### Core Value Propositions
1. **Self-Hosted** — Your data never leaves your infrastructure
2. **Open Source** — No per-seat licensing, no vendor lock-in
3. **Modern Stack** — Built on Next.js 15, not legacy Java/PHP
4. **High-Density UI** — Designed for power users, not checkbox features

### Primary Conversion Goals
| Priority | Goal | Target Action |
|----------|------|---------------|
| 1 | GitHub Stars | Click → GitHub repo |
| 2 | Demo Usage | Click → Live demo |
| 3 | Self-Deploy | Click → Deployment docs |
| 4 | Enterprise Contact | Submit contact form |

---

## Target Audience

### Primary Personas

#### 1. Maintenance Manager "Mike"
- **Role:** Manages 5-20 technicians at a manufacturing plant
- **Age:** 35-55
- **Tech Comfort:** Moderate (uses Excel, maybe tried other CMMS)
- **Pain Points:**
  - Current system is spreadsheets or paper
  - Previous CMMS was too expensive or too complex
  - Needs to justify ROI to plant manager
- **What They Need to See:**
  - Screenshots of actual UI
  - Simple pricing (free)
  - Quick proof it works (demo)
  - Mobile capability for techs

#### 2. Plant Engineer / IT Lead "Sarah"
- **Role:** Evaluates and implements software for operations
- **Age:** 28-45
- **Tech Comfort:** High (understands databases, APIs, security)
- **Pain Points:**
  - Vendor lock-in with current SaaS tools
  - Integration nightmares with ERP/SCADA
  - Compliance requirements (data residency, audit logs)
- **What They Need to See:**
  - Architecture documentation
  - API specifications
  - Security whitepaper
  - Self-hosting instructions
  - GitHub activity (is this maintained?)

#### 3. Operations Director "David"
- **Role:** Oversees multiple facilities, reports to C-suite
- **Age:** 45-60
- **Tech Comfort:** Low-moderate
- **Pain Points:**
  - Downtime costs are killing margins
  - No visibility across sites
  - Audit/compliance pressure
- **What They Need to See:**
  - ROI metrics / case studies
  - Enterprise features (SSO, audit logs)
  - That it's "serious" software, not a side project

#### 4. Developer / OSS Evaluator "Alex"
- **Role:** Searching GitHub for CMMS solutions
- **Age:** 25-40
- **Tech Comfort:** Very high
- **Pain Points:**
  - Most OSS CMMS projects are abandoned PHP apps
  - Poor documentation
  - No TypeScript, outdated dependencies
- **What They Need to See:**
  - Modern stack (Next.js, TypeScript, Drizzle)
  - Active commits, responsive maintainers
  - Clean codebase, good DX
  - Docker one-liner

### Audience Priority Matrix

```
                    DECISION POWER
                    Low         High
                ┌───────────┬───────────┐
         High   │  Alex     │  Sarah    │
  TECHNICAL     │  (Dev)    │  (IT Lead)│
  EXPERTISE     ├───────────┼───────────┤
         Low    │  (Techs)  │  Mike     │
                │           │  David    │
                └───────────┴───────────┘
```

**Primary focus:** Sarah (IT Lead) and Mike (Maint. Manager)
**Secondary:** Alex (drives GitHub stars, community growth)

---

## Competitive Positioning

### Competitive Landscape

| Competitor | Type | Pricing | Self-Host | Open Source |
|------------|------|---------|-----------|-------------|
| **UpKeep** | SaaS | $45-75/user/mo | No | No |
| **Fiix** | SaaS | $45-75/user/mo | No | No |
| **Limble** | SaaS | $28-69/user/mo | No | No |
| **MaintainX** | SaaS | $16-49/user/mo | No | No |
| **eMaint** | SaaS | Enterprise pricing | No | No |
| **OpenMAINT** | OSS | Free | Yes | Yes (old tech) |
| **FixIt** | OSS | Free | Yes | Yes (modern) |

### Differentiation Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    MODERN TECH STACK                        │
│                          ▲                                  │
│                          │                                  │
│         OpenMAINT        │           ★ FixIt               │
│         (outdated)       │           (target position)      │
│                          │                                  │
│  VENDOR ◄────────────────┼────────────────► SELF-HOSTED    │
│  LOCK-IN                 │                                  │
│                          │                                  │
│    UpKeep, Fiix,         │                                  │
│    Limble, MaintainX     │                                  │
│                          │                                  │
│                    LEGACY TECH                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Key Messages by Competitor

| Against | Message |
|---------|---------|
| UpKeep/Fiix | "Stop paying $50/user/month for features you don't own" |
| OpenMAINT | "Open source CMMS, built this decade" |
| Spreadsheets | "Graduate from Excel without the enterprise price tag" |

---

## Site Architecture

### Sitemap

```
/v2 (Home)
├── /v2/features
│   ├── /v2/features/work-orders
│   ├── /v2/features/preventive-maintenance
│   ├── /v2/features/inventory
│   ├── /v2/features/analytics
│   └── /v2/features/mobile
├── /v2/architecture (exists)
├── /v2/compare
├── /v2/pricing
├── /v2/deploy
│   ├── /v2/deploy/docker
│   ├── /v2/deploy/vercel
│   └── /v2/deploy/railway
├── /v2/enterprise
├── /v2/docs (→ external or /docs)
└── /v2/contact
```

### Navigation Structure

**Primary Nav (Desktop):**
```
[Logo]                    [Features ▼] [Architecture] [Pricing] [Docs]    [GitHub ★] [Demo →]
```

**Mobile Nav:**
```
[Logo]                                                          [☰ Menu]
```

**Footer:**
```
Product           Resources         Company           Legal
─────────         ─────────         ─────────         ─────────
Features          Documentation     About             Privacy
Pricing           API Reference     Careers           Terms
Architecture      GitHub            Contact           Security
Compare           Community
```

---

## Page Specifications

### Page 1: Homepage (`/v2`)

**Purpose:** Hook visitors, establish credibility, drive to demo/GitHub

**Sections (in order):**

#### 1.1 Hero Section
- **Headline:** "Industrial Intelligence. Open Source."
- **Subhead:** "The high-density CMMS for modern operations. Built for speed, scalability, and total data sovereignty."
- **CTAs:**
  - Primary: "Deploy Now" → GitHub
  - Secondary: "Launch Demo" → Demo app
- **Visual:** Abstract industrial illustration or product screenshot
- **Trust badge:** GitHub stars count (live)

#### 1.2 Live Stats Ticker (existing)
- Keep as-is, adds "operational" feel

#### 1.3 Product Screenshots ⭐ NEW
- **Purpose:** Show the actual product (critical gap)
- **Format:** Tabbed interface or horizontal scroll
- **Tabs:**
  1. Dashboard Overview
  2. Work Order Detail
  3. Equipment Registry
  4. Analytics/Reports
  5. Mobile View
- **Design:**
  - Browser chrome mockup
  - Subtle shadow/depth
  - Hover to highlight features

#### 1.4 Value Props (3 cards) (existing, enhanced)
- Data Sovereignty → links to /architecture
- High-Density UI → links to /features
- Secure by Design → links to /architecture#security

#### 1.5 Social Proof Bar ⭐ NEW
- GitHub stars (live count)
- Forks count
- "Used by X organizations" (when available)
- Optional: Logo cloud (even if "stealth" placeholders)

#### 1.6 Tech Stack CTA (existing)
- Keep as-is, works well

#### 1.7 Quick Deploy Preview ⭐ NEW
- 3-column: Docker | Vercel | Railway
- Each with one-liner command or "1-Click Deploy" button
- Links to /deploy/*

#### 1.8 Footer (existing, enhanced)
- Add GitHub stars badge
- Add "Made with Next.js" badge (appeals to devs)

**Estimated sections:** 8 (focused, not bloated)

---

### Page 2: Features (`/v2/features`)

**Purpose:** Comprehensive feature breakdown for serious evaluators

**Layout:** Long-scroll with anchor navigation

**Sections:**

#### 2.1 Hero
- Headline: "Everything You Need. Nothing You Don't."
- Subhead: Feature overview paragraph

#### 2.2 Feature Navigation
- Sticky horizontal tabs or sidebar
- Jump links to each feature section

#### 2.3 Feature Blocks (repeat pattern)
For each feature:
```
┌─────────────────────────────────────────────────────────┐
│ [Icon]  FEATURE NAME                                    │
│                                                         │
│ ┌─────────────────────┐  ┌───────────────────────────┐ │
│ │                     │  │ • Bullet point            │ │
│ │   Screenshot        │  │ • Bullet point            │ │
│ │                     │  │ • Bullet point            │ │
│ │                     │  │                           │ │
│ └─────────────────────┘  │ [Learn More →]            │ │
│                          └───────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Features to cover:**
1. Work Order Management
2. Preventive Maintenance Scheduling
3. Equipment/Asset Registry
4. Inventory & Spare Parts
5. Labor Time Tracking
6. Analytics & Reporting
7. Mobile-First Interface
8. User Roles & Permissions
9. Audit Logging
10. File Attachments

---

### Page 3: Compare (`/v2/compare`)

**Purpose:** Competitive differentiation, SEO for "UpKeep alternative"

**Sections:**

#### 3.1 Hero
- Headline: "FixIt vs. The Rest"
- Subhead: "See how we compare to traditional CMMS platforms"

#### 3.2 Comparison Table
```
┌─────────────────────────┬────────┬────────┬────────┬────────┬────────┐
│ Feature                 │ FixIt  │ UpKeep │ Fiix   │ Limble │ Maint- │
│                         │        │        │        │        │ ainX   │
├─────────────────────────┼────────┼────────┼────────┼────────┼────────┤
│ Self-Hosted Option      │   ✅   │   ❌   │   ❌   │   ❌   │   ❌   │
│ Open Source             │   ✅   │   ❌   │   ❌   │   ❌   │   ❌   │
│ No Per-User Pricing     │   ✅   │   ❌   │   ❌   │   ❌   │   ❌   │
│ Unlimited Users         │   ✅   │   💰   │   💰   │   💰   │   💰   │
│ Data Export (Full)      │   ✅   │   ⚠️   │   ⚠️   │   ⚠️   │   ⚠️   │
│ Custom Branding         │   ✅   │   💰   │   💰   │   💰   │   💰   │
│ API Access              │   ✅   │   💰   │   💰   │   ✅   │   💰   │
│ Offline Mode            │   🔜   │   ⚠️   │   ❌   │   ⚠️   │   ✅   │
│ Work Orders             │   ✅   │   ✅   │   ✅   │   ✅   │   ✅   │
│ Preventive Maintenance  │   ✅   │   ✅   │   ✅   │   ✅   │   ✅   │
│ Inventory Management    │   ✅   │   ✅   │   ✅   │   ✅   │   ✅   │
│ Mobile App              │   ✅   │   ✅   │   ✅   │   ✅   │   ✅   │
└─────────────────────────┴────────┴────────┴────────┴────────┴────────┘

✅ Included  💰 Paid Add-on  ⚠️ Limited  ❌ Not Available  🔜 Coming Soon
```

#### 3.3 Cost Calculator
- Interactive widget
- Inputs: # of users, current spend
- Output: Annual savings with FixIt
- Emotional hook: "What would you do with $X back?"

#### 3.4 Migration CTA
- "Switching from [Competitor]? We can help."
- Link to migration guide or contact form

---

### Page 4: Pricing (`/v2/pricing`)

**Purpose:** Make the free model clear, introduce enterprise option

**Sections:**

#### 4.1 Pricing Cards
```
┌─────────────────────┐  ┌─────────────────────┐
│     COMMUNITY       │  │     ENTERPRISE      │
│                     │  │                     │
│       FREE          │  │    Contact Us       │
│      Forever        │  │                     │
│                     │  │                     │
│ ✓ All features      │  │ ✓ Everything in     │
│ ✓ Unlimited users   │  │   Community, plus:  │
│ ✓ Self-hosted       │  │ ✓ SSO/SAML          │
│ ✓ Community support │  │ ✓ Priority support  │
│                     │  │ ✓ SLA guarantee     │
│ [Deploy Now]        │  │ ✓ Custom training   │
│                     │  │                     │
│                     │  │ [Contact Sales]     │
└─────────────────────┘  └─────────────────────┘
```

#### 4.2 FAQ
- "Is it really free?"
- "What's the catch?"
- "Do you offer support?"
- "Can I use this commercially?"

---

### Page 5: Deploy (`/v2/deploy`)

**Purpose:** Reduce friction to first deployment

**Sections:**

#### 5.1 Deployment Options Grid
- Docker Compose (recommended)
- Vercel (1-click)
- Railway (1-click)
- Manual / Bare metal

#### 5.2 Quick Start Code Block
```bash
# Clone and run
git clone https://github.com/0xForelsket/fixit-app.git
cd fixit-app
cp .env.example .env
docker compose up -d

# Open http://localhost:3000
```

#### 5.3 Environment Configuration
- Required env vars table
- Database setup instructions
- S3/storage configuration

#### 5.4 Next Steps
- Create first user
- Import equipment
- Set up PM schedules

---

### Page 6: Enterprise (`/v2/enterprise`)

**Purpose:** Capture enterprise leads, establish credibility for large orgs

**Sections:**

#### 6.1 Hero
- Headline: "FixIt for the Enterprise"
- Subhead: "Open source flexibility with enterprise-grade support"

#### 6.2 Enterprise Features
- SSO/SAML integration
- Advanced audit logging
- Multi-site management
- Custom SLA
- Dedicated support
- Training & onboarding

#### 6.3 Security & Compliance
- SOC 2 readiness (roadmap)
- GDPR compliance
- Data residency options
- Encryption standards

#### 6.4 Contact Form
- Company name
- # of sites
- Current CMMS
- Message

---

## Design System

### Typography

| Element | Font | Weight | Size | Tracking |
|---------|------|--------|------|----------|
| H1 | Serif (brand) | 900 | 5xl-8xl | -0.02em |
| H2 | Serif (brand) | 900 | 3xl-4xl | -0.01em |
| H3 | Sans | 800 | xl-2xl | normal |
| Body | Sans | 400 | base-lg | normal |
| Mono/Code | Mono | 700 | xs-sm | 0.05-0.2em |
| Labels | Mono | 800 | [10px] | 0.2-0.4em |

### Color Usage

| Purpose | Token | Usage |
|---------|-------|-------|
| Primary action | `primary` | CTAs, links, accents |
| Background | `background` | Page background |
| Card surfaces | `card` | Elevated containers |
| Borders | `border` | Dividers, card edges |
| Muted text | `muted-foreground` | Secondary text |
| Success | `success-500` | Positive indicators |
| Danger | `danger-500` | Alerts, warnings |

### Spacing Scale

- Section padding: `py-16 md:py-24 lg:py-32`
- Content max-width: `max-w-7xl`
- Card padding: `p-6 md:p-8`
- Grid gaps: `gap-4 md:gap-6 lg:gap-8`

### Motion Principles

1. **Purposeful:** Animation should guide attention, not distract
2. **Quick:** Duration 0.2-0.8s max
3. **Eased:** Use custom cubic-bezier for industrial feel: `[0.16, 1, 0.3, 1]`
4. **Scroll-triggered:** Use `whileInView` with `once: true`

### Component Patterns

#### Cards
```tsx
<div className="bg-card border border-border rounded-xl p-6
  hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5
  transition-all duration-300">
```

#### CTAs
```tsx
// Primary
<Button className="bg-primary text-primary-foreground rounded-none
  px-8 h-12 font-black uppercase tracking-widest">

// Secondary
<Button variant="outline" className="border-border rounded-none
  px-8 h-12 font-black uppercase tracking-widest">
```

#### Section Headers
```tsx
<div className="border-t border-border pt-8">
  <h2 className="text-xs font-black tracking-[0.4em] uppercase text-muted-foreground">
    Section Title
  </h2>
</div>
```

---

## Content Strategy

### Voice & Tone

| Attribute | Description | Example |
|-----------|-------------|---------|
| **Confident** | We know our stuff, no hedging | "The best open-source CMMS" not "A pretty good option" |
| **Technical** | Speak to engineers, not MBAs | "Type-safe ORM" not "Easy database" |
| **Industrial** | Evoke factory floor, not SaaS fluff | "Deploy to production" not "Get started today!" |
| **Concise** | Dense information, no filler | Bullet points over paragraphs |

### Headline Formulas

1. **Contrast:** "Open Source. Enterprise Ready."
2. **Challenge:** "Stop Paying Per Seat."
3. **Specificity:** "Built on Next.js 15, Not Legacy PHP."
4. **Benefit:** "Your Data. Your Infrastructure. Your Rules."

### SEO Target Keywords

| Primary | Secondary |
|---------|-----------|
| open source cmms | free cmms software |
| self hosted cmms | cmms github |
| upkeep alternative | fiix alternative |
| maintenance management software | work order software |

### Content Needed

| Asset | Status | Priority |
|-------|--------|----------|
| Product screenshots (5+) | Needed | P0 |
| Hero illustration | Exists | - |
| Feature icons | Using Lucide | - |
| Architecture diagram | Partial | P1 |
| Comparison data | Needed | P1 |
| Customer logos | Needed (later) | P3 |
| Case study | Needed (later) | P3 |
| Video demo | Needed (later) | P2 |

---

## Technical Requirements

### Performance Targets

| Metric | Target |
|--------|--------|
| LCP | < 2.5s |
| FID | < 100ms |
| CLS | < 0.1 |
| Lighthouse Score | > 90 |

### Technical Specs

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS 4
- **Animation:** Framer Motion
- **Deployment:** Same as main app (Vercel/Docker)
- **Analytics:** Plausible or PostHog (privacy-first)

### SEO Requirements

- [ ] Meta titles/descriptions for all pages
- [ ] Open Graph images for social sharing
- [ ] Structured data (Organization, SoftwareApplication)
- [ ] XML sitemap
- [ ] robots.txt
- [ ] Canonical URLs

### Accessibility Requirements

- [ ] WCAG 2.1 AA compliance
- [ ] Keyboard navigation
- [ ] Screen reader testing
- [ ] Color contrast ratios
- [ ] Focus indicators (done in app)
- [ ] Alt text for all images

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [ ] Product screenshots capture (5 screens)
- [ ] Homepage screenshot section
- [ ] GitHub stars badge integration
- [ ] Meta tags and OG images

### Phase 2: Expansion (Week 2)
- [ ] `/v2/features` page
- [ ] `/v2/compare` page with table
- [ ] `/v2/pricing` page
- [ ] Navigation updates

### Phase 3: Conversion (Week 3)
- [ ] `/v2/deploy` page with guides
- [ ] `/v2/enterprise` page with contact form
- [ ] ROI calculator widget
- [ ] Analytics integration

### Phase 4: Polish (Week 4)
- [ ] Animation refinements
- [ ] Performance optimization
- [ ] SEO audit and fixes
- [ ] Cross-browser testing
- [ ] Mobile responsiveness audit

### Phase 5: Growth (Ongoing)
- [ ] Blog/changelog integration
- [ ] Customer testimonials (when available)
- [ ] Video demo production
- [ ] A/B testing setup

---

## Success Metrics

### Primary KPIs

| Metric | Current | Target (90 days) |
|--------|---------|------------------|
| GitHub Stars | ? | +500 |
| Demo Sessions/week | ? | 100 |
| Deploy Guide Views | ? | 200/week |
| Enterprise Inquiries | 0 | 5/month |

### Tracking Plan

| Event | Trigger |
|-------|---------|
| `cta_click` | Any CTA button |
| `github_click` | GitHub link click |
| `demo_launch` | Demo button click |
| `screenshot_view` | Screenshot tab change |
| `deploy_guide_view` | Deploy page visit |
| `enterprise_form_submit` | Contact form submit |

---

## Appendix

### Screenshot Checklist

1. **Dashboard**
   - Show stats cards, recent work orders, quick actions
   - Use realistic demo data

2. **Work Order Detail**
   - Show full work order with comments, attachments
   - Include labor log, checklist

3. **Equipment List**
   - Show table with filters active
   - Mix of statuses (operational, maintenance, down)

4. **Analytics**
   - MTTR chart, work order trends
   - KPI cards

5. **Mobile View**
   - iPhone frame mockup
   - Work order list or detail view

### Competitor Research Links

- UpKeep: https://upkeep.com
- Fiix: https://fiixsoftware.com
- Limble: https://limblecmms.com
- MaintainX: https://getmaintainx.com

---

*Document version: 2.0*
*Author: Claude Code*
*Status: Draft for Review*
