import Link from "next/link";

export function LandingPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-8 industrial-grid overflow-hidden bg-gradient-to-br from-zinc-50 to-orange-50/30">
      {/* Decorative background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative text-center max-w-2xl animate-in">
        <div className="mb-8 flex justify-center">
          <div className="group relative">
            <div className="absolute inset-0 bg-primary-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-4xl font-bold text-white shadow-2xl">
              F
            </div>
          </div>
        </div>

        <h1 className="text-6xl font-black tracking-tight mb-4 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-700 bg-clip-text text-transparent">
          FixIt <span className="text-primary-600">CMMS</span>
        </h1>

        <p className="text-xl text-zinc-500 font-medium mb-10 max-w-md mx-auto leading-relaxed">
          High-precision maintenance management for modern industrial
          environments.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="px-10 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-bold shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 hover:-translate-y-0.5 transition-all text-lg"
          >
            Sign In to Station
          </Link>
        </div>

        <div className="mt-16 pt-8 border-t border-zinc-200/50 flex flex-wrap justify-center gap-x-10 gap-y-4 text-zinc-400 font-mono text-xs font-bold uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success-500" />
            Real-time Tracking
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary-500" />
            Equipment BOMs
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-secondary-500" />
            Maintenance Logs
          </div>
        </div>
      </div>
    </main>
  );
}
