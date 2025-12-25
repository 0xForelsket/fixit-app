"use client";

import { type LoginState, login } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActionState } from "react";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, initialState);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100 p-4">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary-600">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-primary-600 text-3xl font-bold text-white shadow-lg">
            F
          </div>
          <CardTitle className="text-2xl font-bold text-primary-700">
            FixIt
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Sign in with your Employee ID and PIN
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee ID</Label>
              <Input
                id="employeeId"
                name="employeeId"
                placeholder="e.g., TECH-001"
                autoComplete="username"
                disabled={isPending}
                required
                style={{ textTransform: "uppercase" }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pin">PIN</Label>
              <Input
                id="pin"
                name="pin"
                type="password"
                placeholder="Enter your PIN"
                autoComplete="current-password"
                disabled={isPending}
                required
                minLength={4}
              />
            </div>
            {state.error && (
              <div className="rounded-md bg-danger-100 p-3 text-sm text-danger-700">
                {state.error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
