export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-slate-200 rounded" />
        <div className="h-10 w-32 bg-slate-200 rounded" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {["stat-1", "stat-2", "stat-3", "stat-4"].map((id) => (
          <div
            key={id}
            className="h-24 rounded-xl border bg-card p-4 shadow-sm"
          >
            <div className="h-4 w-20 bg-slate-200 rounded mb-3" />
            <div className="h-8 w-16 bg-slate-200 rounded" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="border-b p-4">
          <div className="h-6 w-32 bg-slate-200 rounded" />
        </div>
        <div className="divide-y">
          {["row-1", "row-2", "row-3", "row-4", "row-5"].map((id) => (
            <div key={id} className="flex items-center gap-4 p-4">
              <div className="h-4 w-4 bg-slate-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-slate-200 rounded" />
                <div className="h-3 w-1/2 bg-slate-200 rounded" />
              </div>
              <div className="h-6 w-20 bg-slate-200 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
