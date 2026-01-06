import {
  type GetAttachmentsFilters,
  getAllAttachments,
} from "@/actions/attachments";
import { DocumentsView } from "@/components/documents/documents-view";
import { PageLayout } from "@/components/ui/page-layout";
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
    entityType:
      resolvedParams.entityType as GetAttachmentsFilters["entityType"],
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
    <PageLayout
      id="documents-page"
      title="Documents"
      subtitle="File Management"
      description="MANAGE AND ORGANIZE ALL SYSTEM FILES AND ATTACHMENTS"
      bgSymbol="DC"
    >
      <DocumentsView
        initialAttachments={attachments || []}
        currentUserId={user?.id}
        isUserAdmin={isUserAdmin}
      />
    </PageLayout>
  );
}
