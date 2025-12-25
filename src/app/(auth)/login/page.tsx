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
    <main className="flex min-h-screen items-center justify-center p-4 industrial-grid bg-gradient-to-br from-zinc-50 via-white to-orange-50">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary-500/10 rounded-full blur-3xl" />
      </div>

      <Card className="relative w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm animate-in">
        {/* Orange accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 via-primary-400 to-primary-600 rounded-t-lg" />

        <CardHeader className="text-center pt-8 pb-2">
          {/* Industrial Logo */}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-3xl font-bold text-white shadow-lg shadow-primary-500/30 hover:scale-105 transition-transform">
            F
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
            FixIt
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Sign in with your Employee ID and PIN
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employeeId" className="text-sm font-medium">
                Employee ID
              </Label>
              <Input
                id="employeeId"
                name="employeeId"
                placeholder="e.g., TECH-001"
                autoComplete="username"
                disabled={isPending}
                required
                className="font-mono uppercase tracking-wider focus:border-primary-400 focus:ring-primary-400/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pin" className="text-sm font-medium">
                PIN
              </Label>
              <Input
                id="pin"
                name="pin"
                type="password"
                placeholder="Enter your PIN"
                autoComplete="current-password"
                disabled={isPending}
                required
                minLength={4}
                className="font-mono tracking-widest focus:border-primary-400 focus:ring-primary-400/20"
              />
            </div>

            {state.error && (
              <div className="rounded-lg bg-danger-50 border border-danger-200 p-3 text-sm text-danger-700 flex items-center gap-2">
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                {state.error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold shadow-md shadow-primary-500/25 hover:shadow-lg hover:shadow-primary-500/30 transition-all duration-200"
              disabled={isPending}
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Demo credentials hint */}
          <div className="mt-6 pt-4 border-t border-zinc-100 text-center">
            <p className="text-xs text-muted-foreground">
              Demo: <span className="font-mono text-primary-600">ADMIN-001</span>{" "}
              / <span className="font-mono text-primary-600">1234</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
