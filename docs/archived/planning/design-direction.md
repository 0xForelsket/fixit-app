# FixIt CMMS — Design Direction

## Aesthetic: Industrial Digital

A **bold, utilitarian design language** inspired by factory floors, control panels, and precision engineering. Dark, confident, and instantly readable in any lighting condition.

---

## Core Principles

### 1. **Form Follows Function**
Every element serves a purpose. No decorative fluff. Information density over whitespace waste.

### 2. **Instant Status Recognition**
Critical information (machine status, ticket priority) must be visible in < 0.5 seconds. Bold colors, clear iconography, unmistakable states.

### 3. **Light Mode Default, Dark Mode Available**
Light mode as default for office environments. Dark mode available for factory floors and low-light conditions. High contrast in both modes.

### 4. **Technical Precision**
Monospace typography for data. Grid-based layouts. Sharp corners with purpose. Engineering drawing inspiration.

---

## Color Palette

### Primary: Industrial Orange
```
#f97316 - Primary (Action, CTA)
#fb923c - Primary Light (Hover)
#ea580c - Primary Dark (Active)
```
*Orange = machinery, safety equipment, attention. The universal language of industry.*

### Accent: Steel Blue
```
#0ea5e9 - Secondary (Links, Info)
#38bdf8 - Secondary Light
#0284c7 - Secondary Dark
```
*Blue = digital, technical, trustworthy. Complements orange without competing.*

### Status Colors
```
#22c55e - Operational (Green - GO)
#ef4444 - Down/Critical (Red - STOP)
#f59e0b - Maintenance (Amber - CAUTION)
#8b5cf6 - In Progress (Purple - ACTIVE)
```

### Surfaces (Light Mode Default)
```
#fafafa - Background (Light)
#ffffff - Card/Surface
#f4f4f5 - Elevated Surface
#e4e4e7 - Border
#71717a - Muted Text
#18181b - Primary Text
```

### Surfaces (Dark Mode)
```
#09090b - Background
#18181b - Card/Surface
#27272a - Elevated Surface
#3f3f46 - Border
#a1a1aa - Muted Text
#fafafa - Primary Text
```

---

## Typography

### Display: JetBrains Mono
Technical, precise, distinctive. Used for:
- Machine IDs
- Ticket numbers
- SKUs and codes
- Data values

### Body: Outfit
Modern, readable, professional. Used for:
- Body text
- Navigation
- Buttons
- Descriptions

### Hierarchy
```
H1: 2.25rem / Bold / Outfit
H2: 1.5rem / Semibold / Outfit  
H3: 1.25rem / Medium / Outfit
Body: 0.875rem / Regular / Outfit
Small: 0.75rem / Regular / Outfit
Mono: 0.875rem / Regular / JetBrains Mono
```

---

## Component Patterns

### Cards
- **Background**: Frosted glass effect with subtle gradient
- **Border**: 1px subtle glow on hover
- **Shadow**: Diffused, layered
- **Corner radius**: 8px (functional, not playful)

### Buttons
- **Primary**: Solid orange, white text, hover glow
- **Secondary**: Ghost with border, fills on hover
- **Destructive**: Red with confirmation pattern

### Status Badges
- **Critical**: Pulsing glow, unmistakable
- **Active**: Subtle animation
- **Resolved**: Muted, recedes visually

### Tables/Lists
- **Zebra striping**: Subtle
- **Row hover**: Orange tint
- **Selected**: Orange left border accent

---

## Motion

### Entry Animations
- Staggered fade-in for lists (50ms delay each)
- Slide-up for modals
- Scale-in for toasts

### Micro-interactions
- Button press: subtle scale down
- Card hover: lift with shadow
- Status change: color pulse

### Timing
```
Fast: 150ms (hover states)
Normal: 200ms (transitions)
Slow: 300ms (page transitions)
Spring: 500ms (dramatic entrances)
```

---

## Layout

### Grid System
- 12-column grid (desktop)
- 4-column (mobile)
- 16px base spacing

### Density
High information density. Technicians need data, not padding.

### Navigation
- Fixed sidebar (desktop)
- Bottom tabs (mobile)
- Orange accent on active state

---

## Visual Texture

### Background
Subtle grid pattern overlay reminiscent of engineering paper:
```css
background-image: 
  linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
  linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
background-size: 32px 32px;
```

### Accent Glows
Orange glow on focus and hover states:
```css
box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.3);
```

---

## Voice & Tone

- **Direct**: "Machine down" not "There seems to be an issue"
- **Technical**: Use industry terms
- **Actionable**: Every screen has a clear next step
- **Urgent when needed**: Critical alerts demand attention

---

## Anti-Patterns (What to Avoid)

❌ Pastel colors
❌ Rounded "friendly" corners (> 12px)
❌ Excessive whitespace
❌ Generic illustrations
❌ Purple gradients on white
❌ Inter/Roboto/Arial fonts
❌ Subtle grays for status indicators
❌ "Cute" empty states

---

## Implementation Priority

1. **globals.css** - Design tokens and base styles
2. **Login page** - First impression
3. **Dashboard** - Most used screen
4. **Ticket details** - Core workflow
5. **Sidebar** - Navigation backbone
