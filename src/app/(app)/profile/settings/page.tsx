import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { PageLayout } from "@/components/ui/page-layout";
import { getProfileData } from "@/data/profile";
import { ArrowLeft, Bell, Globe, Palette, Shield } from "lucide-react";
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
      <div className="mx-auto max-w-2xl space-y-8 pb-8">
        {/* Profile Section */}
        <Card className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100 fill-mode-both">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {t("profile")}
            </CardTitle>
            <CardDescription>{t("profileDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm
              initialName={profile.name}
              initialEmail={profile.email ?? ""}
            />
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200 fill-mode-both">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              {t("security")}
            </CardTitle>
            <CardDescription>{t("securityDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <SecurityForm />
          </CardContent>
        </Card>

        {/* Language Section */}
        <Card className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300 fill-mode-both">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              {t("language")}
            </CardTitle>
            <CardDescription>{t("languageDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">{t("displayLanguage")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("displayLanguageDesc")}
                </p>
              </div>
              <LanguageSwitcher showLabel />
            </div>
          </CardContent>
        </Card>

        {/* Appearance Section */}
        <Card className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-[400ms] fill-mode-both">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              {t("appearance")}
            </CardTitle>
            <CardDescription>{t("appearanceDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <AppearanceForm preferences={profile.preferences} />
          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-[500ms] fill-mode-both">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              {t("notifications")}
            </CardTitle>
            <CardDescription>{t("notificationsDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <NotificationsForm preferences={profile.preferences} />
          </CardContent>
        </Card>

        {/* Account Info (read-only) */}
        <Card className="bg-muted/30 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-[600ms] fill-mode-both">
          <CardHeader>
            <CardTitle className="text-lg">{t("account")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">{t("employeeId")}</p>
                <p className="font-mono font-medium">{profile.employeeId}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t("role")}</p>
                <p className="font-medium capitalize">{profile.roleName}</p>
              </div>
              {profile.departmentName && (
                <div>
                  <p className="text-muted-foreground">{t("department")}</p>
                  <p className="font-medium">{profile.departmentName}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground">{t("memberSince")}</p>
                <p className="font-medium">
                  {new Date(profile.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
