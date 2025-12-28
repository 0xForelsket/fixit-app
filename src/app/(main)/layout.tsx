import { DashboardShell } from "@/components/layout/dashboard-shell";
import { MaintenanceTrigger } from "@/components/maintenance-trigger";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";
import { getUserAvatarUrl } from "@/lib/users";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!hasPermission(user.permissions, PERMISSIONS.TICKET_VIEW_ALL)) {
    redirect("/");
  }

  const avatarUrl = await getUserAvatarUrl(user.id);

  return (
    <DashboardShell user={user} avatarUrl={avatarUrl}>
      <MaintenanceTrigger />
      {children}
    </DashboardShell>
  );
}
