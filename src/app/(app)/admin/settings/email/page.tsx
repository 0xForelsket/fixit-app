import { getSmtpSettings } from "@/actions/email-settings";
import { EmailSettingsForm } from "@/components/admin/email-settings-form";
import { Mail } from "lucide-react";
import { redirect } from "next/navigation";

export default async function EmailSettingsPage() {
  const result = await getSmtpSettings();

  if (!result.success || !result.data) {
    redirect("/admin/settings");
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-zinc-200 pb-8">
        <h1 className="text-3xl font-black tracking-tight text-zinc-900 uppercase">
          Email <span className="text-primary-600">Settings</span>
        </h1>
        <div className="flex items-center gap-2 font-mono text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
          <Mail className="h-3.5 w-3.5" />
          SMTP CONFIGURATION
        </div>
      </div>

      <EmailSettingsForm initialSettings={result.data} />
    </div>
  );
}
