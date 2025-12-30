"use client";

import { changePin, revokeAllSessions } from "@/actions/profile-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionResult } from "@/lib/types/actions";
import { Check, Key, Loader2, LogOut } from "lucide-react";
import { useActionState, useEffect, useState, useTransition } from "react";

export function SecurityForm() {
  const [state, formAction, isPending] = useActionState<
    ActionResult<null>,
    FormData
  >(changePin, { success: true, data: null });
  const [showSuccess, setShowSuccess] = useState(false);
  const [isRevokingPending, startRevokeTransition] = useTransition();

  useEffect(() => {
    if (state.success) {
      setShowSuccess(true);
      // Clear form
      const form = document.getElementById("pin-form") as HTMLFormElement;
      form?.reset();
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [state.success]);

  const handleRevokeAllSessions = () => {
    if (confirm("This will log you out of all devices. Continue?")) {
      startRevokeTransition(async () => {
        await revokeAllSessions();
        // Will redirect to login since session is deleted
        window.location.href = "/login";
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Change PIN Form */}
      <div>
        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
          <Key className="h-4 w-4" />
          Change PIN
        </h4>
        <form id="pin-form" action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPin">Current PIN</Label>
            <Input
              id="currentPin"
              name="currentPin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]{4}"
              maxLength={4}
              placeholder="Enter current 4-digit PIN"
              required
              className="font-mono tracking-widest"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="newPin">New PIN</Label>
              <Input
                id="newPin"
                name="newPin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]{4}"
                maxLength={4}
                placeholder="4 digits"
                required
                className="font-mono tracking-widest"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPin">Confirm New PIN</Label>
              <Input
                id="confirmPin"
                name="confirmPin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]{4}"
                maxLength={4}
                placeholder="4 digits"
                required
                className="font-mono tracking-widest"
              />
            </div>
          </div>

          {!state.success && state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update PIN"
              )}
            </Button>
            {showSuccess && (
              <span className="text-sm text-green-600 flex items-center gap-1">
                <Check className="h-4 w-4" />
                PIN updated!
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Session Management */}
      <div className="border-t pt-6">
        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
          <LogOut className="h-4 w-4" />
          Session Management
        </h4>
        <p className="text-sm text-muted-foreground mb-4">
          Log out of all devices where you are currently signed in.
        </p>
        <Button
          variant="outline"
          onClick={handleRevokeAllSessions}
          disabled={isRevokingPending}
        >
          {isRevokingPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Logging out...
            </>
          ) : (
            <>
              <LogOut className="mr-2 h-4 w-4" />
              Log Out All Devices
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
