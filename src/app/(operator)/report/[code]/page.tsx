import { db } from "@/db";
import { equipment as equipmentTable } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { cn } from "@/lib/utils";
import { eq } from "drizzle-orm";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Factory,
  MapPin,
  User,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ReportForm } from "./report-form";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function ReportPage({ params }: PageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { code } = await params;

  // Find equipment by code
  const equipmentItem = await db.query.equipment.findFirst({
    where: eq(equipmentTable.code, code.toUpperCase()),
    with: {
      location: true,
      owner: {
        columns: {
          id: true,
          name: true,
          employeeId: true,
        },
      },
    },
  });

  if (!equipmentItem) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      {/* Navigation */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Equipment
      </Link>

      {/* Equipment Header Card */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        {/* Status Stripe */}
        <div
          className={cn(
            "h-2 w-full",
            equipmentItem.status === "operational" && "bg-success-500",
            equipmentItem.status === "down" && "bg-danger-500",
            equipmentItem.status === "maintenance" && "bg-warning-500"
          )}
        />

        <div className="p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-muted border-2 border-muted-foreground/10">
                <Factory className="h-10 w-10 text-muted-foreground/60" />
              </div>

              <div className="space-y-2">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    {equipmentItem.name}
                  </h1>
                  <p className="font-mono text-sm font-medium text-muted-foreground mt-1">
                    #{equipmentItem.code}
                  </p>
                </div>

                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                  {equipmentItem.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 shrink-0" />
                      {equipmentItem.location.name}
                    </div>
                  )}

                  {equipmentItem.owner && (
                    <div className="flex items-center gap-1.5">
                      <User className="h-4 w-4 shrink-0" />
                      Owner: {equipmentItem.owner.name}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <EquipmentStatusBadge status={equipmentItem.status} />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold border-b pb-2">New Ticket Details</h2>
        <ReportForm equipment={equipmentItem} />
      </div>
    </div>
  );
}

function EquipmentStatusBadge({
  status,
}: {
  status: "operational" | "down" | "maintenance";
}) {
  const config = {
    operational: {
      bg: "bg-success-100",
      text: "text-success-800",
      border: "border-success-200",
      icon: CheckCircle2,
      label: "Operational",
    },
    down: {
      bg: "bg-danger-100",
      text: "text-danger-800",
      border: "border-danger-200",
      icon: AlertTriangle,
      label: "Line Down",
    },
    maintenance: {
      bg: "bg-warning-100",
      text: "text-warning-800",
      border: "border-warning-200",
      icon: Wrench,
      label: "Maintenance",
    },
  }[status];

  const Icon = config.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border px-4 py-2 shadow-sm",
        config.bg,
        config.border
      )}
    >
      <Icon className={cn("h-5 w-5", config.text)} />
      <span className={cn("font-bold uppercase tracking-wide", config.text)}>
        {config.label}
      </span>
    </div>
  );
}
