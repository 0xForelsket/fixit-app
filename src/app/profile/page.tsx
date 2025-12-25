import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { attachments } from "@/db/schema";
import { getPresignedDownloadUrl } from "@/lib/s3";
import { getCurrentUser } from "@/lib/session";
import { and, eq } from "drizzle-orm";
import { ArrowLeft, User } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AvatarUpload } from "./avatar-upload";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch current avatar
  const avatar = await db.query.attachments.findFirst({
    where: and(
      eq(attachments.entityType, "user"),
      eq(attachments.entityId, user.id),
      eq(attachments.type, "avatar")
    ),
    orderBy: (attachments, { desc }) => [desc(attachments.createdAt)],
  });

  const avatarUrl = avatar ? await getPresignedDownloadUrl(avatar.s3Key) : null;

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-lg px-4 space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link
              href={
                user.role === "tech" || user.role === "admin"
                  ? "/dashboard"
                  : "/"
              }
              className="gap-2 text-muted-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>

        <div className="rounded-2xl border bg-white p-8 shadow-sm text-center">
          <div className="relative mx-auto mb-6 h-32 w-32">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user.name}
                className="h-full w-full rounded-full object-cover border-4 border-slate-100"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-100 border-4 border-white shadow-inner">
                <User className="h-16 w-16 text-slate-300" />
              </div>
            )}
          </div>

          <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
          <p className="text-slate-500 font-mono text-sm mt-1">
            {user.employeeId}
          </p>
          <div className="mt-2 inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 uppercase tracking-wide">
            {user.role}
          </div>

          <div className="mt-8 border-t pt-8 text-left">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">
              Update Profile Picture
            </h2>
            <AvatarUpload userId={user.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
