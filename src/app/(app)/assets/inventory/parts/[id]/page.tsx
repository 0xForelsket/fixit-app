import { AuditLogList } from "@/components/audit/audit-log-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getVendors } from "@/data/vendors";
import { db } from "@/db";
import { spareParts } from "@/db/schema";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/session";
import { eq } from "drizzle-orm";
import { History, Info } from "lucide-react";
import { notFound } from "next/navigation";
import { PartForm } from "../part-form";

async function getPart(id: string) {
  return db.query.spareParts.findFirst({
    where: eq(spareParts.id, id),
  });
}

export default async function EditPartPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(PERMISSIONS.INVENTORY_UPDATE);

  const { id: partId } = await params;

  const [part, vendors] = await Promise.all([getPart(partId), getVendors()]);

  if (!part) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="edit" className="w-full">
        <TabsList>
          <TabsTrigger value="edit" className="gap-2">
            <Info className="h-4 w-4" />
            Edit Details
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <History className="h-4 w-4" />
            System Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="mt-6">
          <PartForm part={part} vendors={vendors} />
        </TabsContent>

        <TabsContent value="logs" className="mt-6">
          <div className="max-w-2xl">
            <AuditLogList entityType="spare_part" entityId={partId} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
