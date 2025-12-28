import type { SessionUser } from "@/lib/session";

interface WelcomeBannerProps {
  user: SessionUser;
  avatarUrl: string | null;
}

export function WelcomeBanner({ user, avatarUrl }: WelcomeBannerProps) {
  const date = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <section className="relative overflow-hidden rounded-3xl bg-zinc-900 p-6 sm:p-8 text-white shadow-xl shadow-zinc-900/10 mb-8 ring-1 ring-white/10">
      <div className="relative z-10 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
            {user.name}
          </h1>
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-primary-500/10 px-2 py-1 text-xs font-bold text-primary-500 ring-1 ring-inset ring-primary-500/20 uppercase tracking-widest">
              {user.roleName}
            </span>
            <span className="hidden sm:inline text-zinc-500">•</span>
            <p className="hidden sm:block font-mono text-sm text-zinc-400 uppercase tracking-wider">
              {date}
            </p>
          </div>
        </div>

        <div className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-2xl border-2 border-white/10 bg-zinc-800 shadow-inner">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={user.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-zinc-800 text-xl font-bold text-zinc-500">
              {user.name.charAt(0)}
            </div>
          )}
        </div>
      </div>

      {/* Industrial Decorations */}
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary-500/10 blur-3xl pointer-events-none" />
      <div className="absolute right-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-white/10 to-transparent opacity-50" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50" />
    </section>
  );
}
