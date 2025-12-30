import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getProfileData } from "@/data/profile";
import { ArrowLeft, Bell, Palette, Settings, Shield } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppearanceForm } from "./appearance-form";
import { NotificationsForm } from "./notifications-form";
import { ProfileForm } from "./profile-form";
import { SecurityForm } from "./security-form";

export default async function ProfileSettingsPage() {
  const profile = await getProfileData();

  if (!profile) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="mx-auto max-w-2xl px-4 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/profile" className="gap-2 text-muted-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back to Profile
            </Link>
          </Button>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" />
            Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>

        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              Profile
            </CardTitle>
            <CardDescription>Update your personal information.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm
              initialName={profile.name}
              initialEmail={profile.email ?? ""}
            />
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Security
            </CardTitle>
            <CardDescription>
              Manage your PIN and session security.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SecurityForm />
          </CardContent>
        </Card>

        {/* Appearance Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Appearance
            </CardTitle>
            <CardDescription>
              Customize how the app looks and feels.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AppearanceForm preferences={profile.preferences} />
          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure how you receive notifications.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NotificationsForm preferences={profile.preferences} />
          </CardContent>
        </Card>

        {/* Account Info (read-only) */}
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-lg">Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Employee ID</p>
                <p className="font-mono font-medium">{profile.employeeId}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Role</p>
                <p className="font-medium capitalize">{profile.roleName}</p>
              </div>
              {profile.departmentName && (
                <div>
                  <p className="text-muted-foreground">Department</p>
                  <p className="font-medium">{profile.departmentName}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground">Member Since</p>
                <p className="font-medium">
                  {new Date(profile.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
