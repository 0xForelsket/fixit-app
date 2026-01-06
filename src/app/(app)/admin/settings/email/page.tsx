import { getSmtpSettings } from "@/actions/email-settings";
import { EmailSettingsForm } from "@/components/admin/email-settings-form";
import { PageLayout } from "@/components/ui/page-layout";
import { redirect } from "next/navigation";

export default async function EmailSettingsPage() {
  const result = await getSmtpSettings();

  if (!result.success || !result.data) {
    redirect("/admin/settings");
  }

  return (
    <PageLayout
      id="email-settings-page"
      title="Email Settings"
      subtitle="SMTP Configuration"
      description="CONFIGURE EMAIL DELIVERY SETTINGS"
      bgSymbol="EM"
    >
      <div className="max-w-4xl">
        <EmailSettingsForm initialSettings={result.data} />
      </div>
    </PageLayout>
  );
}
