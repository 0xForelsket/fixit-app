import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { StatsCard } from "@/components/ui/stats-card";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Activity,
  BookOpen,
  CheckCircle2,
  Clock,
  LayoutTemplate,
  Loader2,
  Palette,
  Plus,
  Search,
  Space,
  Type,
  User,
} from "lucide-react";
import Link from "next/link";

export default function DesignSystemPage() {
  return (
    <div className="space-y-12 pb-20">
      <PageHeader
        title="Industrial UI"
        highlight="Design System"
        description="Core components and design tokens for the FixIt application."
        icon={LayoutTemplate}
      />

      {/* Documentation Link */}
      <Card className="bg-primary-50 border-primary-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <BookOpen className="h-8 w-8 text-primary-600" />
            <div className="flex-1">
              <h3 className="font-semibold text-primary-900">
                Design System Documentation
              </h3>
              <p className="text-sm text-primary-700">
                Full design tokens, usage guidelines, and code examples.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/docs/design-system.md" target="_blank">
                View Docs
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table of Contents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Navigation</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href="#colors">
              <Palette className="h-4 w-4 mr-2" />
              Colors
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="#typography">
              <Type className="h-4 w-4 mr-2" />
              Typography
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="#spacing">
              <Space className="h-4 w-4 mr-2" />
              Spacing
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="#buttons">Buttons</a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="#badges">Badges</a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="#forms">Form Elements</a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="#stats">Stats Cards</a>
          </Button>
        </CardContent>
      </Card>

      {/* 1. Colors */}
      <section id="colors" className="space-y-4 scroll-mt-8">
        <h2 className="text-2xl font-bold tracking-tight border-b pb-2 flex items-center gap-2">
          <Palette className="h-6 w-6" />
          Colors
        </h2>
        <p className="text-muted-foreground">
          Industrial color palette with semantic meaning. Primary orange for
          actions, status colors for equipment and work order states.
        </p>
        <div className="grid gap-8">
          <ColorSwatch
            name="Primary (Industrial Orange)"
            description="CTAs, active states, brand identity"
            variable="primary"
            colors={[
              "50",
              "100",
              "200",
              "300",
              "400",
              "500",
              "600",
              "700",
              "800",
              "900",
              "950",
            ]}
          />
          <ColorSwatch
            name="Secondary (Steel Blue)"
            description="Information, links, secondary actions"
            variable="secondary"
            colors={[
              "50",
              "100",
              "200",
              "300",
              "400",
              "500",
              "600",
              "700",
              "800",
              "900",
            ]}
          />
          <div className="grid gap-8 md:grid-cols-3">
            <ColorSwatch
              name="Success"
              description="Completed, operational"
              variable="success"
              colors={["100", "500", "600"]}
            />
            <ColorSwatch
              name="Warning"
              description="Pending, maintenance"
              variable="warning"
              colors={["100", "500", "600"]}
            />
            <ColorSwatch
              name="Danger"
              description="Errors, critical, down"
              variable="danger"
              colors={["100", "500", "600"]}
            />
          </div>
        </div>
      </section>

      {/* 2. Typography */}
      <section id="typography" className="space-y-4 scroll-mt-8">
        <h2 className="text-2xl font-bold tracking-tight border-b pb-2 flex items-center gap-2">
          <Type className="h-6 w-6" />
          Typography
        </h2>
        <p className="text-muted-foreground">
          Outfit for UI text, JetBrains Mono for data and equipment IDs.
        </p>
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="grid gap-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                Headings (Outfit)
              </span>
              <h1 className="text-4xl font-black tracking-tight lg:text-5xl">
                Heading 1 - Black (900)
              </h1>
              <h2 className="text-3xl font-bold tracking-tight">
                Heading 2 - Bold (700)
              </h2>
              <h3 className="text-2xl font-semibold tracking-tight">
                Heading 3 - Semibold (600)
              </h3>
              <h4 className="text-xl font-semibold tracking-tight">
                Heading 4 - Semibold (600)
              </h4>
            </div>
            <div className="grid gap-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                Body Text
              </span>
              <p className="leading-7">
                The quick brown fox jumps over the lazy dog. Industrial design
                favors high legibility and contrast for use in various lighting
                conditions.
              </p>
              <p className="text-sm text-muted-foreground">
                Small text (14px) - For descriptions and metadata.
              </p>
              <p className="text-xs text-muted-foreground">
                Extra small (12px) - For timestamps and captions.
              </p>
            </div>
            <div className="grid gap-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                Monospace (JetBrains Mono)
              </span>
              <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
                const equipment_id = &quot;EQ-2024-001&quot;;
              </code>
              <p className="font-mono text-sm">
                EQP-HVAC-001 • SKU-12345 • WO-2024-0001
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 3. Spacing Scale */}
      <section id="spacing" className="space-y-4 scroll-mt-8">
        <h2 className="text-2xl font-bold tracking-tight border-b pb-2 flex items-center gap-2">
          <Space className="h-6 w-6" />
          Spacing Scale
        </h2>
        <p className="text-muted-foreground">
          Based on 4px increments. Use consistent spacing for visual rhythm.
        </p>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[
                { token: "1", value: "4px", usage: "Inline spacing" },
                { token: "2", value: "8px", usage: "Standard gap between related items" },
                { token: "3", value: "12px", usage: "Small padding" },
                { token: "4", value: "16px", usage: "Card padding, comfortable gap" },
                { token: "6", value: "24px", usage: "Standard container padding" },
                { token: "8", value: "32px", usage: "Large section spacing" },
                { token: "10", value: "40px", usage: "Page margins (mobile)" },
                { token: "12", value: "48px", usage: "Page margins (desktop)" },
              ].map((item) => (
                <div key={item.token} className="flex items-center gap-4">
                  <div
                    className="bg-primary-500 rounded flex-shrink-0"
                    style={{
                      width: item.value,
                      height: "24px",
                    }}
                  />
                  <div className="flex-1 grid grid-cols-3 gap-4 text-sm">
                    <code className="font-mono text-primary-600">
                      {item.token}
                    </code>
                    <span className="text-muted-foreground">{item.value}</span>
                    <span>{item.usage}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 4. Buttons */}
      <section id="buttons" className="space-y-4 scroll-mt-8">
        <h2 className="text-2xl font-bold tracking-tight border-b pb-2">
          Buttons
        </h2>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Variants</CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex flex-wrap gap-4">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sizes & States</CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex flex-wrap items-center gap-4">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon">
              <Plus className="h-4 w-4" />
            </Button>
            <Button disabled>Disabled</Button>
            <Button disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* 5. Badges */}
      <section id="badges" className="space-y-4 scroll-mt-8">
        <h2 className="text-2xl font-bold tracking-tight border-b pb-2">
          Badges & Status
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Standard Badges</CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="danger">Danger</Badge>
              <Badge variant="critical">Critical</Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-mono">
                &lt;StatusBadge /&gt;
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  Work Order Status
                </p>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status="open" />
                  <StatusBadge status="in_progress" />
                  <StatusBadge status="resolved" />
                  <StatusBadge status="closed" />
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  Equipment Status
                </p>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status="operational" />
                  <StatusBadge status="maintenance" />
                  <StatusBadge status="down" />
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Priority</p>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status="critical" />
                  <StatusBadge status="high" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 6. Form Elements */}
      <section id="forms" className="space-y-4 scroll-mt-8">
        <h2 className="text-2xl font-bold tracking-tight border-b pb-2">
          Form Elements
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Standard Input</Label>
              <Input type="text" placeholder="Enter value..." />
            </div>
            <div className="grid gap-2">
              <Label>Password</Label>
              <Input type="password" placeholder="••••••••" />
            </div>
            <div className="grid gap-2">
              <Label className="text-destructive">Error State</Label>
              <Input
                placeholder="Invalid input"
                className="border-destructive focus-visible:ring-destructive"
              />
              <span className="text-xs text-destructive">
                This field is required.
              </span>
            </div>
          </div>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Search with Icon</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Search..." className="pl-9" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>File Upload</Label>
              <Input type="file" />
            </div>
            <div className="grid gap-2">
              <Label>Disabled Input</Label>
              <Input disabled value="Cannot edit" />
            </div>
          </div>
        </div>
      </section>

      {/* 7. Stats Cards */}
      <section id="stats" className="space-y-4 scroll-mt-8">
        <h2 className="text-2xl font-bold tracking-tight border-b pb-2">
          Stats Cards
        </h2>
        <p className="text-muted-foreground">
          Use for dashboard KPIs and metrics. Supports variants, trends, and
          click-through links.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Revenue"
            value="$45,231"
            icon={Activity}
            variant="default"
            trend={{ value: 12, positive: true, label: "vs last month" }}
          />
          <StatsCard
            title="Active Users"
            value="2,350"
            icon={User}
            variant="primary"
            active
            description="Currently online"
          />
          <StatsCard
            title="Pending Tasks"
            value="15"
            icon={Clock}
            variant="warning"
            trend={{ value: 2, positive: false }}
          />
          <StatsCard
            title="System Status"
            value="98.2%"
            icon={CheckCircle2}
            variant="success"
          />
        </div>
      </section>

      {/* Status Indicators */}
      <section className="space-y-4 scroll-mt-8">
        <h2 className="text-2xl font-bold tracking-tight border-b pb-2">
          Status Indicators
        </h2>
        <Card>
          <CardContent className="p-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium mb-3">Status Dots</p>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="status-dot status-operational" />
                    <span className="text-sm">Operational</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="status-dot status-maintenance" />
                    <span className="text-sm">Maintenance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="status-dot status-down" />
                    <span className="text-sm">Down</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="status-dot status-in-progress" />
                    <span className="text-sm">In Progress</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-3">Priority Badges</p>
                <div className="flex flex-wrap gap-2">
                  <span className="priority-critical px-2 py-1 rounded text-xs font-bold">
                    CRITICAL
                  </span>
                  <span className="priority-high px-2 py-1 rounded text-xs font-bold">
                    HIGH
                  </span>
                  <span className="priority-medium px-2 py-1 rounded text-xs font-bold">
                    MEDIUM
                  </span>
                  <span className="priority-low px-2 py-1 rounded text-xs font-bold">
                    LOW
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Animation Examples */}
      <section className="space-y-4 scroll-mt-8">
        <h2 className="text-2xl font-bold tracking-tight border-b pb-2">
          Animations
        </h2>
        <Card>
          <CardContent className="p-6 space-y-6">
            <div>
              <p className="text-sm font-medium mb-3">Hover Effects</p>
              <div className="flex gap-4">
                <div className="hover-lift cursor-pointer p-4 bg-muted rounded-lg border">
                  Hover Lift
                </div>
                <div className="hover-accent cursor-pointer p-4 bg-card rounded-lg border">
                  Hover Accent
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-3">Interactive States</p>
              <div className="flex gap-4">
                <button type="button" className="focus-ring px-4 py-2 bg-primary-500 text-white rounded-lg">
                  Focus Ring (Tab to me)
                </button>
                <div className="animate-glow-pulse p-4 bg-card rounded-lg border">
                  Glow Pulse
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function ColorSwatch({
  name,
  description,
  variable,
  colors,
}: {
  name: string;
  description?: string;
  variable: string;
  colors: string[];
}) {
  return (
    <div>
      <h3 className="mb-1 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        {name}
      </h3>
      {description && (
        <p className="text-xs text-muted-foreground mb-3">{description}</p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {colors.map((shade) => (
          <div key={shade} className="space-y-1.5">
            <div
              className="h-16 w-full rounded-lg shadow-sm border"
              style={{ backgroundColor: `var(--color-${variable}-${shade})` }}
            />
            <div className="px-1">
              <p className="text-xs font-medium text-foreground">
                {variable}-{shade}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
