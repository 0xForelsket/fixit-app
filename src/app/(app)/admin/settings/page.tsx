import { getAllSystemSettings } from "@/actions/settings";
import { SettingsForm } from "@/components/admin/settings-form";
import { PageLayout } from "@/components/ui/page-layout";

export default async function SettingsPage() {
  const settings = await getAllSystemSettings();

  return (
    <PageLayout
      id="settings-page"
      title="System Settings"
      subtitle="Configuration"
      description="SYSTEM CONFIGURATION AND PREFERENCES"
      bgSymbol="ST"
    >
      <div className="max-w-4xl">
        <SettingsForm initialSettings={settings} />
      </div>
    </PageLayout>
  );
}
