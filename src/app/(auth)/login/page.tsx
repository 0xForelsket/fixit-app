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
    <main className="flex min-h-screen items-center justify-center p-4 bg-zinc-950 font-sans selection:bg-orange-500/30">
      {/* Background Pattern: Adds texture to the background for visual interest */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#a1a1aa_1px,transparent_1px)] [background-size:16px_16px]" />

      {/* Decorative Gradient Blob: Provides a subtle glow effect behind the card */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[100px] pointer-events-none" />

      <Card className="relative z-10 w-full max-w-sm bg-zinc-900/90 border-zinc-800 shadow-2xl backdrop-blur-xl ring-1 ring-white/5">
        <CardHeader className="text-center pb-8 pt-10">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/20 text-zinc-950">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-7 h-7"
            >
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold text-zinc-100 tracking-tight">
            FixIt CMMS
          </CardTitle>
          <CardDescription className="text-zinc-400 mt-2">
            Secure Industrial Access
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form action={formAction} className="space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="employeeId"
                className="text-xs uppercase tracking-wider text-zinc-500 font-semibold ml-1"
              >
                Employee ID
              </Label>
              <Input
                id="employeeId"
                name="employeeId"
                placeholder="TECH-001"
                autoComplete="username"
                disabled={isPending}
                required
                className="bg-zinc-950/50 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 font-mono tracking-wide focus:border-orange-500/50 focus:ring-orange-500/20 h-11 uppercase"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <Label
                  htmlFor="pin"
                  className="text-xs uppercase tracking-wider text-zinc-500 font-semibold"
                >
                  PIN Code
                </Label>
              </div>
              <Input
                id="pin"
                name="pin"
                type="password"
                placeholder="••••"
                autoComplete="current-password"
                disabled={isPending}
                required
                minLength={4}
                className="bg-zinc-950/50 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 font-mono tracking-[0.5em] text-center focus:border-orange-500/50 focus:ring-orange-500/20 h-11"
              />
            </div>

            {state.error && (
              <div className="rounded-md bg-red-950/30 border border-red-900/50 p-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
                <div className="h-2 w-2 rounded-full bg-red-500 flex-shrink-0 animate-pulse" />
                <p className="text-xs font-medium text-red-200">
                  {state.error}
                </p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 bg-orange-600 hover:bg-orange-500 text-white font-semibold shadow-lg shadow-orange-900/20 hover:shadow-orange-900/40 transition-all duration-300"
              disabled={isPending}
            >
              {isPending ? (
                <span className="flex items-center gap-2 text-white/90">
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
                  Authenticating...
                </span>
              ) : (
                "Access System"
              )}
            </Button>
          </form>

          {/* Helper for demo: Shows default credentials for easier testing */}
          <div className="mt-8 pt-6 border-t border-zinc-800/50 text-center">
            <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3 font-semibold">
              Development Access
            </p>
            <div className="grid grid-cols-3 gap-2 text-xs font-mono text-zinc-500">
              <div
                className="bg-zinc-950/30 rounded py-1 px-2 border border-zinc-800/50 hover:border-zinc-700 hover:text-zinc-400 transition-colors cursor-help"
                title="PIN: 1234"
              >
                ADMIN-001
              </div>
              <div
                className="bg-zinc-950/30 rounded py-1 px-2 border border-zinc-800/50 hover:border-zinc-700 hover:text-zinc-400 transition-colors cursor-help"
                title="PIN: 5678"
              >
                TECH-001
              </div>
              <div
                className="bg-zinc-950/30 rounded py-1 px-2 border border-zinc-800/50 hover:border-zinc-700 hover:text-zinc-400 transition-colors cursor-help"
                title="PIN: 0000"
              >
                OP-001
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer: System status indicator */}
      <div className="absolute bottom-6 text-zinc-700 text-xs font-mono">
        v0.1.0 • SYSTEM OPERATIONAL
      </div>
    </main>
  );
}
