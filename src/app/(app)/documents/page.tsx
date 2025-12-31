import {
  type GetAttachmentsFilters,
  getAllAttachments,
} from "@/actions/attachments";
import { DocumentsView } from "@/components/documents/documents-view";
import { PageHeader } from "@/components/ui/page-header";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documents | FixIt",
  description: "Centralized documents hub",
};

interface PageProps {
  searchParams: Promise<{
    entityType?: string;
    mimeType?: string;
    search?: string;
  }>;
}

export default async function DocumentsPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const filters: GetAttachmentsFilters = {
    entityType: resolvedParams.entityType as any,
    mimeType: resolvedParams.mimeType,
    search: resolvedParams.search,
  };

  const result = await getAllAttachments(filters);
  const attachments = result.success ? result.data : [];

  const user = await getCurrentUser();
  const dbUser = user
    ? await db.query.users.findFirst({
        where: eq(users.id, user.id),
        with: { assignedRole: true },
      })
    : null;

  const isUserAdmin = dbUser?.assignedRole?.name === "admin";

  return (
    <div className="flex min-h-screen flex-col">
      <PageHeader
        title="Documents"
        description="Manage and organized all system files and attachments."
      />
      <DocumentsView
        initialAttachments={attachments || []}
        currentUserId={user?.id}
        isUserAdmin={isUserAdmin}
      />
    </div>
  );
}
