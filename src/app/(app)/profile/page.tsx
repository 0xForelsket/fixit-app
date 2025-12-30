import { User } from "lucide-react";
import { db } from "@/db";
import { attachments } from "@/db/schema";
import { redirect } from "next/navigation";

import { getPresignedDownloadUrl } from "@/lib/s3";
import { getCurrentUser } from "@/lib/session";
import { and, eq } from "drizzle-orm";
import { PageHeader } from "@/components/ui/page-header";
import { AvatarUpload } from "./avatar-upload";
import { ProfileForm } from "./settings/profile-form";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/dashboard");
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
    <div className="flex flex-col gap-6 p-6">
      <PageHeader title="My Profile" subtitle="User Settings" />

      <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
        <div className="space-y-6">
          {/* Avatar Card */}
          <div className="card-premium rounded-xl p-6 text-center">
            <div className="relative mx-auto mb-4 h-32 w-32">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={user.name}
                  className="h-full w-full rounded-full object-cover ring-2 ring-primary/10"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full bg-muted border-2 border-border shadow-inner">
                  <User className="h-16 w-16 text-muted-foreground/50" />
                </div>
              )}
            </div>

            <h2 className="text-xl font-bold font-serif-brand">{user.name}</h2>
            <p className="text-sm font-mono text-muted-foreground mt-1">
              {user.employeeId}
            </p>
            <div className="mt-3 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary uppercase tracking-wider">
              {user.roleName}
            </div>
            
            <div className="mt-6 border-t border-border pt-6 text-left">
               <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
                Update Photo
              </h3>
              <AvatarUpload userId={user.id} />
             </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Profile Form Card */}
          <div className="card-premium rounded-xl p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-serif-brand font-bold mb-1">Profile</h2>
              <p className="text-muted-foreground">Update your personal information.</p>
            </div>
             <ProfileForm initialName={user.name} initialEmail={""} />
          </div>
        </div>
      </div>
    </div>
  );
}
