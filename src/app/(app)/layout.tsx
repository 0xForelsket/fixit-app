import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getCurrentUser } from "@/lib/session";
import { getUserAvatarUrl } from "@/lib/users";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const avatarUrl = await getUserAvatarUrl(user.id);

  return (
    <DashboardShell user={user} avatarUrl={avatarUrl}>
      {children}
    </DashboardShell>
  );
}
