export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-56 bg-slate-200 rounded mb-2" />
          <div className="h-4 w-72 bg-slate-200 rounded" />
        </div>
      </div>

      {/* Stats cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {["admin-stat-1", "admin-stat-2", "admin-stat-3", "admin-stat-4"].map(
          (id) => (
            <div
              key={id}
              className="h-28 rounded-xl border bg-card p-4 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 bg-slate-200 rounded-lg" />
                <div className="h-4 w-20 bg-slate-200 rounded" />
              </div>
              <div className="h-8 w-16 bg-slate-200 rounded" />
            </div>
          )
        )}
      </div>

      {/* Content grid skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        {["grid-1", "grid-2"].map((gridId) => (
          <div key={gridId} className="rounded-xl border bg-card shadow-sm">
            <div className="border-b p-4">
              <div className="h-6 w-40 bg-slate-200 rounded" />
            </div>
            <div className="divide-y">
              {[
                `${gridId}-row-1`,
                `${gridId}-row-2`,
                `${gridId}-row-3`,
                `${gridId}-row-4`,
              ].map((rowId) => (
                <div key={rowId} className="flex items-center gap-4 p-4">
                  <div className="h-10 w-10 bg-slate-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-slate-200 rounded" />
                    <div className="h-3 w-1/2 bg-slate-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
