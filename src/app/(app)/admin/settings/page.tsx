import { getAllSystemSettings } from "@/actions/settings";
import { SettingsForm } from "@/components/admin/settings-form";
import { Settings } from "lucide-react";

export default async function SettingsPage() {
  const settings = await getAllSystemSettings();

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-zinc-200 pb-8">
        <h1 className="text-3xl font-black tracking-tight text-zinc-900 uppercase">
          System <span className="text-primary-600">Settings</span>
        </h1>
        <div className="flex items-center gap-2 font-mono text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
          <Settings className="h-3.5 w-3.5" />
          CONFIGURATION AND PREFERENCES
        </div>
      </div>

      <SettingsForm initialSettings={settings} />
    </div>
  );
}
