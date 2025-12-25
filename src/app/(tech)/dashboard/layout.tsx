import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
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

  if (user.role === "operator") {
    redirect("/");
  }

  const avatarUrl = await getUserAvatarUrl(user.id);

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar user={user} avatarUrl={avatarUrl} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title="Dashboard" userId={user.id} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
