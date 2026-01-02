"use client";

import {
  saveSmtpSettings,
  sendTestEmail,
  testSmtpSettings,
} from "@/actions/email-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  Loader2,
  Mail,
  Save,
  Send,
  Server,
  XCircle,
} from "lucide-react";
import { useState, useTransition } from "react";

interface EmailSettingsFormProps {
  initialSettings: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    fromAddress: string;
    fromName: string;
    hasPassword: boolean;
  };
}

export function EmailSettingsForm({ initialSettings }: EmailSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isTesting, setIsTesting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [testEmail, setTestEmail] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await saveSmtpSettings(formData);
      if (result.success) {
        setMessage({ type: "success", text: "Settings saved successfully" });
      } else {
        setMessage({
          type: "error",
          text: result.error || "Failed to save settings",
        });
      }
      setTimeout(() => setMessage(null), 5000);
    });
  };

  const handleTest = async (formData: FormData) => {
    setIsTesting(true);
    setMessage(null);

    const result = await testSmtpSettings(formData);
    if (result.success) {
      setMessage({
        type: "success",
        text: result.data?.message || "Connection successful!",
      });
    } else {
      setMessage({ type: "error", text: result.error || "Connection failed" });
    }

    setIsTesting(false);
  };

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      setMessage({ type: "error", text: "Please enter an email address" });
      return;
    }

    setIsSending(true);
    setMessage(null);

    const result = await sendTestEmail(testEmail);
    if (result.success) {
      setMessage({
        type: "success",
        text: result.data?.message || "Test email sent!",
      });
    } else {
      setMessage({
        type: "error",
        text: result.error || "Failed to send test email",
      });
    }

    setIsSending(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* SMTP Server Settings */}
      <section className="rounded-xl border bg-white p-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
            <Server className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">SMTP Server</h2>
            <p className="text-sm text-muted-foreground">
              Configure your outgoing email server
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="host">SMTP Host *</Label>
            <Input
              id="host"
              name="host"
              placeholder="smtp.gmail.com"
              defaultValue={initialSettings.host}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="port">Port *</Label>
            <Input
              id="port"
              name="port"
              type="number"
              placeholder="587"
              defaultValue={initialSettings.port}
              min={1}
              max={65535}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="user">Username *</Label>
            <Input
              id="user"
              name="user"
              placeholder="your-email@gmail.com"
              defaultValue={initialSettings.user}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              Password{" "}
              {initialSettings.hasPassword
                ? "(leave blank to keep current)"
                : "*"}
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder={
                initialSettings.hasPassword
                  ? "••••••••"
                  : "App password or SMTP password"
              }
              required={!initialSettings.hasPassword}
            />
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="secure"
                value="true"
                defaultChecked={initialSettings.secure}
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm">Use TLS/SSL (port 465)</span>
            </label>
            <p className="text-xs text-muted-foreground mt-1 ml-6">
              Enable for port 465. For port 587 with STARTTLS, leave unchecked.
            </p>
          </div>
        </div>
      </section>

      {/* Sender Settings */}
      <section className="rounded-xl border bg-white p-6 animate-in fade-in slide-in-from-bottom-2 duration-500 animate-stagger-1">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
            <Mail className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Sender Information</h2>
            <p className="text-sm text-muted-foreground">
              Configure how emails appear to recipients
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fromAddress">From Email Address *</Label>
            <Input
              id="fromAddress"
              name="fromAddress"
              type="email"
              placeholder="noreply@yourcompany.com"
              defaultValue={initialSettings.fromAddress}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fromName">From Name</Label>
            <Input
              id="fromName"
              name="fromName"
              placeholder="FixIt CMMS"
              defaultValue={initialSettings.fromName}
            />
          </div>
        </div>
      </section>

      {/* Test Connection */}
      <section className="rounded-xl border bg-white p-6 animate-in fade-in slide-in-from-bottom-2 duration-500 animate-stagger-2">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Test Connection</h2>
            <p className="text-sm text-muted-foreground">
              Verify your settings and send a test email
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={isTesting}
              onClick={() => {
                const form = document.querySelector("form");
                if (form) {
                  handleTest(new FormData(form));
                }
              }}
            >
              {isTesting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Server className="mr-2 h-4 w-4" />
                  Test Connection
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Input
              type="email"
              placeholder="recipient@example.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="max-w-xs"
            />
            <Button
              type="button"
              variant="outline"
              disabled={isSending || !testEmail}
              onClick={handleSendTestEmail}
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Test Email
                </>
              )}
            </Button>
          </div>
        </div>
      </section>

      {/* Message */}
      {message && (
        <div
          className={`flex items-center gap-2 rounded-lg p-4 ${
            message.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <XCircle className="h-5 w-5" />
          )}
          {message.text}
        </div>
      )}

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
