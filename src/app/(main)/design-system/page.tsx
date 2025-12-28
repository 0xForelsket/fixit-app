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
  CheckCircle2,
  Clock,
  LayoutTemplate,
  Loader2,
  Plus,
  Search,
  User,
} from "lucide-react";

export default function DesignSystemPage() {
  return (
    <div className="space-y-12 pb-20">
      <PageHeader
        title="Industrial UI"
        highlight="Design System"
        description="Core components and design tokens for the FixIt application."
        icon={LayoutTemplate}
      />

      {/* 1. Colors */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight border-b pb-2">
          Colors
        </h2>
        <div className="grid gap-8">
          <ColorSwatch
            name="Primary (Industrial Orange)"
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
              variable="success"
              colors={["100", "500", "600"]}
            />
            <ColorSwatch
              name="Warning"
              variable="warning"
              colors={["100", "500", "600"]}
            />
            <ColorSwatch
              name="Danger"
              variable="danger"
              colors={["100", "500", "600"]}
            />
          </div>
        </div>
      </section>

      {/* 2. Typography */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight border-b pb-2">
          Typography
        </h2>
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="grid gap-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                Headings
              </span>
              <h1 className="text-4xl font-black tracking-tight lg:text-5xl">
                Heading 1 (Inter/Outfit)
              </h1>
              <h2 className="text-3xl font-bold tracking-tight">
                Heading 2 (Bold)
              </h2>
              <h3 className="text-2xl font-semibold tracking-tight">
                Heading 3 (Semibold)
              </h3>
              <h4 className="text-xl font-semibold tracking-tight">
                Heading 4
              </h4>
            </div>
            <div className="grid gap-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                Body & Mono
              </span>
              <p className="leading-7">
                The quick brown fox jumps over the lazy dog. Industrial design
                favors high legibility and contrast.
              </p>
              <p className="text-sm text-muted-foreground">
                Small text for descriptions and metadata.
              </p>
              <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
                const equipment_id = "EQ-2024-001";
              </code>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 3. Buttons */}
      <section className="space-y-4">
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

      {/* 4. Badges */}
      <section className="space-y-4">
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
            <CardContent className="p-6 flex flex-wrap gap-2">
              <StatusBadge status="open" />
              <StatusBadge status="in_progress" />
              <StatusBadge status="resolved" />
              <StatusBadge status="closed" />
              <div className="w-full h-px bg-border my-2" />
              <StatusBadge status="operational" />
              <StatusBadge status="maintenance" />
              <StatusBadge status="down" />
              <div className="w-full h-px bg-border my-2" />
              <StatusBadge status="critical" />
              <StatusBadge status="high" />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 5. Inputs */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight border-b pb-2">
          Form Elements
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Email Address</Label>
              <Input type="email" placeholder="user@example.com" />
            </div>
            <div className="grid gap-2">
              <Label>Password</Label>
              <Input type="password" />
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
              <Label>Search (Icon)</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Search..." className="pl-9" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>File Upload (Standard)</Label>
              <Input type="file" />
            </div>
          </div>
        </div>
      </section>

      {/* 6. Stats Cards */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight border-b pb-2">
          Stats Cards
        </h2>
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
            title="Pending tasks"
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
    </div>
  );
}

function ColorSwatch({
  name,
  variable,
  colors,
}: {
  name: string;
  variable: string;
  colors: string[];
}) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        {name}
      </h3>
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
