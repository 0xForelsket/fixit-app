import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";
import { getUserAvatarUrl } from "@/lib/users";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!hasPermission(user.permissions, PERMISSIONS.ALL)) {
    redirect("/dashboard");
  }

  const avatarUrl = await getUserAvatarUrl(user.id);

  return (
    <DashboardShell user={user} avatarUrl={avatarUrl} title="Admin">
      {children}
    </DashboardShell>
  );
}
