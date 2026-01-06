import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { PageLayout } from "@/components/ui/page-layout";
import {
  PillTabs,
  PillTabsContent,
  PillTabsList,
  PillTabsTrigger,
} from "@/components/ui/pill-tabs";
import { getProfileData } from "@/data/profile";
import {
  ArrowLeft,
  Bell,
  Globe,
  Palette,
  Settings,
  Shield,
  User,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppearanceForm } from "./appearance-form";
import { NotificationsForm } from "./notifications-form";
import { ProfileForm } from "./profile-form";
import { SecurityForm } from "./security-form";

export default async function ProfileSettingsPage() {
  const profile = await getProfileData();
  const t = await getTranslations("settings");

  if (!profile) {
    redirect("/login");
  }

  return (
    <PageLayout
      id="settings-page"
      title={t("title")}
      subtitle={t("profile")}
      description={t("subtitle")}
      bgSymbol="ST"
      headerActions={
        <Button variant="ghost" size="sm" asChild>
          <Link href="/profile" className="gap-2 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
            {t("backToProfile")}
          </Link>
        </Button>
      }
    >
      <PillTabs defaultValue="general" className="mx-auto max-w-4xl">
        <PillTabsList>
          <PillTabsTrigger value="general">
            <User className="h-3.5 w-3.5" />
            {t("profile")}
          </PillTabsTrigger>
          <PillTabsTrigger value="security">
            <Shield className="h-3.5 w-3.5" />
            {t("security")}
          </PillTabsTrigger>
          <PillTabsTrigger value="preferences">
            <Settings className="h-3.5 w-3.5" />
            {t("appearance")}
          </PillTabsTrigger>
        </PillTabsList>

        <PillTabsContent value="general" className="space-y-6">
          <section className="bg-card rounded-xl border p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{t("profile")}</h2>
                <p className="text-sm text-muted-foreground">{t("profileDesc")}</p>
              </div>
            </div>
            <ProfileForm
              initialName={profile.name}
              initialEmail={profile.email ?? ""}
            />
          </section>

          <section className="bg-muted/30 rounded-xl border p-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-6">
              {t("account")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">{t("employeeId")}</p>
                <p className="font-mono text-sm font-bold">{profile.employeeId}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">{t("role")}</p>
                <p className="text-sm font-bold capitalize">{profile.roleName}</p>
              </div>
              {profile.departmentName && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">{t("department")}</p>
                  <p className="text-sm font-bold">{profile.departmentName}</p>
                </div>
              )}
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">{t("memberSince")}</p>
                <p className="text-sm font-bold">
                  {new Date(profile.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </section>
        </PillTabsContent>

        <PillTabsContent value="security" className="space-y-6">
          <section className="bg-card rounded-xl border p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{t("security")}</h2>
                <p className="text-sm text-muted-foreground">{t("securityDesc")}</p>
              </div>
            </div>
            <SecurityForm />
          </section>
        </PillTabsContent>

        <PillTabsContent value="preferences" className="space-y-6">
          <div className="grid gap-6">
            <section className="bg-card rounded-xl border p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Palette className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">{t("appearance")}</h2>
                  <p className="text-sm text-muted-foreground">{t("appearanceDesc")}</p>
                </div>
              </div>
              <AppearanceForm preferences={profile.preferences} />
            </section>

            <section className="bg-card rounded-xl border p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">{t("notifications")}</h2>
                  <p className="text-sm text-muted-foreground">{t("notificationsDesc")}</p>
                </div>
              </div>
              <NotificationsForm preferences={profile.preferences} />
            </section>

            <section className="bg-card rounded-xl border p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">{t("language")}</h2>
                  <p className="text-sm text-muted-foreground">{t("languageDesc")}</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                <div className="space-y-1">
                  <p className="text-sm font-bold">{t("displayLanguage")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("displayLanguageDesc")}
                  </p>
                </div>
                <LanguageSwitcher showLabel />
              </div>
            </section>
          </div>
        </PillTabsContent>
      </PillTabs>
    </PageLayout>
  );
}
