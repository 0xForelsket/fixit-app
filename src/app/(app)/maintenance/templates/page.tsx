import { getWorkOrderTemplates } from "@/actions/workOrderTemplates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCurrentUser } from "@/lib/session";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowUpCircle,
  ChevronRight,
  Clock,
  FileText,
  Plus,
  Scale,
  Search,
  ShieldAlert,
  Wrench,
  Zap,
} from "lucide-react";
import Link from "next/link";

const typeConfig: Record<
  string,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  breakdown: {
    label: "Breakdown",
    icon: Zap,
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
  maintenance: {
    label: "Maintenance",
    icon: Wrench,
    color: "text-primary-600",
    bg: "bg-primary-50",
  },
  calibration: {
    label: "Calibration",
    icon: Scale,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  safety: {
    label: "Safety",
    icon: ShieldAlert,
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  upgrade: {
    label: "Upgrade",
    icon: ArrowUpCircle,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
};

const priorityConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "warning" | "destructive" }
> = {
  low: { label: "Low", variant: "secondary" },
  medium: { label: "Medium", variant: "default" },
  high: { label: "High", variant: "warning" },
  critical: { label: "Critical", variant: "destructive" },
};

type SearchParams = {
  search?: string;
  type?: string;
};

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const allTemplates = await getWorkOrderTemplates();

  // Filter templates
  let templates = [...allTemplates];

  if (params.search) {
    const search = params.search.toLowerCase();
    templates = templates.filter(
      (t) =>
        t.name.toLowerCase().includes(search) ||
        t.description?.toLowerCase().includes(search) ||
        t.defaultTitle?.toLowerCase().includes(search)
    );
  }

  if (params.type && params.type !== "all") {
    templates = templates.filter((t) => t.type === params.type);
  }

  // Stats
  const totalCount = allTemplates.length;
  const byType = {
    breakdown: allTemplates.filter((t) => t.type === "breakdown").length,
    maintenance: allTemplates.filter((t) => t.type === "maintenance").length,
    calibration: allTemplates.filter((t) => t.type === "calibration").length,
    safety: allTemplates.filter((t) => t.type === "safety").length,
    upgrade: allTemplates.filter((t) => t.type === "upgrade").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/maintenance/schedules">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Work Order Templates
            </h1>
            <p className="text-muted-foreground">
              {templates.length} template{templates.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        {user?.roleName === "admin" && (
          <Button asChild>
            <Link href="/maintenance/templates/new">
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Link>
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <StatCard
          title="Total"
          value={totalCount}
          icon={FileText}
          color="text-slate-600"
          bg="bg-slate-50"
        />
        <StatCard
          title="Maintenance"
          value={byType.maintenance}
          icon={Wrench}
          color="text-primary-600"
          bg="bg-primary-50"
        />
        <StatCard
          title="Breakdown"
          value={byType.breakdown}
          icon={Zap}
          color="text-rose-600"
          bg="bg-rose-50"
        />
        <StatCard
          title="Calibration"
          value={byType.calibration}
          icon={Scale}
          color="text-amber-600"
          bg="bg-amber-50"
        />
        <StatCard
          title="Safety"
          value={byType.safety}
          icon={ShieldAlert}
          color="text-orange-600"
          bg="bg-orange-50"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <form
          action="/maintenance/templates"
          className="relative flex-1 md:max-w-sm"
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            name="search"
            placeholder="Search templates..."
            defaultValue={params.search}
            className="w-full rounded-lg border bg-white py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </form>
        <div className="flex gap-2">
          <FilterLink
            href="/maintenance/templates"
            active={!params.type || params.type === "all"}
          >
            All
          </FilterLink>
          <FilterLink
            href="/maintenance/templates?type=maintenance"
            active={params.type === "maintenance"}
          >
            Maintenance
          </FilterLink>
          <FilterLink
            href="/maintenance/templates?type=breakdown"
            active={params.type === "breakdown"}
          >
            Breakdown
          </FilterLink>
          <FilterLink
            href="/maintenance/templates?type=calibration"
            active={params.type === "calibration"}
          >
            Calibration
          </FilterLink>
        </div>
      </div>

      {/* Templates List */}
      {templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No templates found</h3>
          <p className="text-sm text-muted-foreground">
            Create your first work order template to get started
          </p>
          <Button className="mt-4" asChild>
            <Link href="/maintenance/templates/new">
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <Table className="w-full text-sm">
            <TableHeader className="bg-slate-50">
              <TableRow className="border-b text-left font-medium text-muted-foreground hover:bg-transparent">
                <TableHead className="p-3">Template</TableHead>
                <TableHead className="p-3 hidden md:table-cell">Type</TableHead>
                <TableHead className="p-3">Priority</TableHead>
                <TableHead className="p-3 hidden lg:table-cell">Department</TableHead>
                <TableHead className="p-3 hidden xl:table-cell">Est. Time</TableHead>
                <TableHead className="p-3 w-10" />
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y">
              {templates.map((template) => {
                const config = typeConfig[template.type];
                const priority = priorityConfig[template.priority];
                const Icon = config.icon;

                return (
                  <TableRow
                    key={template.id}
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    <TableCell className="p-3">
                      <Link
                        href={`/maintenance/templates/${template.id}/edit`}
                        className="flex items-center gap-3 group/item"
                      >
                        <div
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-lg transition-transform group-hover/item:scale-110",
                            config.bg
                          )}
                        >
                          <Icon className={cn("h-4 w-4", config.color)} />
                        </div>
                        <div>
                          <p className="font-medium group-hover/item:text-primary-600 transition-colors">
                            {template.name}
                          </p>
                          {template.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {template.description}
                            </p>
                          )}
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="p-3 hidden md:table-cell">
                      <span className={cn("capitalize", config.color)}>
                        {config.label}
                      </span>
                    </TableCell>
                    <TableCell className="p-3">
                      <Badge variant={priority.variant}>{priority.label}</Badge>
                    </TableCell>
                    <TableCell className="p-3 hidden lg:table-cell text-muted-foreground">
                      {template.department?.name || "-"}
                    </TableCell>
                    <TableCell className="p-3 hidden xl:table-cell">
                      {template.estimatedMinutes ? (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {template.estimatedMinutes} min
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="p-3">
                      <Link
                        href={`/maintenance/templates/${template.id}/edit`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-slate-100 hover:text-foreground"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  bg,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bg: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-white p-4">
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg",
          bg
        )}
      >
        <Icon className={cn("h-5 w-5", color)} />
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className={cn("text-2xl font-bold", color)}>{value}</p>
      </div>
    </div>
  );
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary-100 text-primary-700"
          : "text-muted-foreground hover:bg-slate-100 hover:text-foreground"
      )}
    >
      {children}
    </Link>
  );
}
