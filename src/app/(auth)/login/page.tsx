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

import { ThemeToggle } from "@/components/layout/theme-toggle"; // Add import

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, initialState);

  const demoAccounts =
    process.env.NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS === "true"
      ? [
          { role: "System Admin", id: "ADMIN-001", pin: "123456" },
          { role: "Molding Manager", id: "MGT-MOLD", pin: "123456" },
          { role: "Molding Tech", id: "TECH-MOLD-01", pin: "567890" },
          { role: "Operator", id: "OP-001", pin: "000000" },
        ]
      : [];

  const fillCredentials = (employeeId: string, pin: string) => {
    const idInput = document.getElementById("employeeId") as HTMLInputElement;
    const pinInput = document.getElementById("pin") as HTMLInputElement;
    if (idInput && pinInput) {
      idInput.value = employeeId;
      pinInput.value = pin;
    }
  };

  return (
    <main className="flex min-h-screen">
      {/* Left Panel - Promotional/Info Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-zinc-950 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 -left-20 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 -right-20 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl" />
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px]" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 text-white">
          <div className="mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-3xl font-bold shadow-lg shadow-primary-500/30 mb-6">
              F
            </div>
            <h1 className="text-4xl xl:text-5xl font-bold mb-4">FixIt CMMS</h1>
            <p className="text-xl text-zinc-400 max-w-md">
              Streamline your maintenance operations with our comprehensive
              management system.
            </p>
          </div>

          <div className="space-y-6 mt-8">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-primary-500">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Work Order Management</h3>
                <p className="text-zinc-400 text-sm">
                  Track and manage maintenance tasks efficiently
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-primary-500">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Asset Tracking</h3>
                <p className="text-zinc-400 text-sm">
                  Monitor equipment health and maintenance history
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-primary-500">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Analytics & Reports</h3>
                <p className="text-zinc-400 text-sm">
                  Data-driven insights for better decisions
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-zinc-800">
            <p className="text-sm text-zinc-500">
              Trusted by maintenance teams worldwide
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 bg-gradient-to-br from-zinc-50 via-white to-orange-50 relative">
        <div className="absolute top-4 right-4 z-20">
          <ThemeToggle />
        </div>
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none lg:left-1/2">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary-500/10 rounded-full blur-3xl" />
        </div>

        <Card className="relative w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          {/* Orange accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 via-primary-400 to-primary-600 rounded-t-lg" />

          <CardHeader className="text-center pt-8 pb-2">
            {/* Mobile Logo - only shows on smaller screens */}
            <div className="lg:hidden mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-3xl font-bold text-white shadow-lg shadow-primary-500/30">
              F
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
              Welcome Back
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
                    aria-hidden="true"
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
                    <svg
                      className="animate-spin h-4 w-4"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
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

            {/* Demo credentials hint - Only visible in demo mode */}
            {process.env.NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS === "true" && (
              <div className="mt-8 pt-6 border-t border-zinc-100">
                <div className="flex items-center gap-2 mb-4 justify-center">
                  <div className="h-px bg-zinc-200 flex-1" />
                  <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">
                    Demo Access
                  </span>
                  <div className="h-px bg-zinc-200 flex-1" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {demoAccounts.map((acc) => (
                    <Button
                      key={acc.id}
                      type="button"
                      variant="outline"
                      className="h-auto py-3 px-3 flex flex-col items-start gap-1.5 border-zinc-200 hover:border-primary-500 hover:bg-primary-50/50 bg-white transition-all group cursor-pointer"
                      onClick={() => fillCredentials(acc.id, acc.pin)}
                    >
                      <span className="text-xs font-bold text-zinc-700 group-hover:text-primary-700">
                        {acc.role}
                      </span>
                      <div className="flex items-center gap-2 w-full">
                        <span className="font-mono text-[10px] text-zinc-400 group-hover:text-primary-600/80">
                          {acc.id}
                        </span>
                        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-zinc-200 group-hover:bg-primary-500 transition-colors" />
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
