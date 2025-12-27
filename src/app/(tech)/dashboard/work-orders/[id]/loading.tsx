export default function WorkOrderDetailLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12 animate-pulse">
      {/* Back button skeleton */}
      <div className="h-9 w-40 bg-slate-200 rounded" />

      {/* Header card skeleton */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-slate-200 rounded-lg" />
            <div className="space-y-2">
              <div className="h-3 w-12 bg-slate-200 rounded" />
              <div className="h-5 w-24 bg-slate-200 rounded" />
            </div>
          </div>
          <div className="h-6 w-20 bg-slate-200 rounded" />
        </div>
        <div className="p-6 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-5 w-16 bg-slate-200 rounded" />
            <div className="h-4 w-32 bg-slate-200 rounded" />
          </div>
          <div className="h-8 w-2/3 bg-slate-200 rounded" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description skeleton */}
          <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
            <div className="h-6 w-28 bg-slate-200 rounded" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-slate-200 rounded" />
              <div className="h-4 w-5/6 bg-slate-200 rounded" />
              <div className="h-4 w-4/6 bg-slate-200 rounded" />
            </div>
          </div>

          {/* Activity log skeleton */}
          <div className="space-y-4">
            <div className="h-6 w-28 bg-slate-200 rounded" />
            <div className="rounded-xl border bg-card shadow-sm divide-y">
              {["log-1", "log-2", "log-3"].map((id) => (
                <div key={id} className="p-4 flex gap-4">
                  <div className="h-8 w-8 bg-slate-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-slate-200 rounded" />
                    <div className="h-4 w-48 bg-slate-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Actions skeleton */}
          <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
            <div className="h-10 w-full bg-slate-200 rounded" />
            <div className="h-10 w-full bg-slate-200 rounded" />
          </div>

          {/* Equipment info skeleton */}
          <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
            <div className="bg-slate-100 px-4 py-3 border-b">
              <div className="h-4 w-20 bg-slate-200 rounded" />
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-slate-200 rounded-lg" />
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-slate-200 rounded" />
                  <div className="h-5 w-16 bg-slate-200 rounded" />
                </div>
              </div>
            </div>
          </div>

          {/* Details skeleton */}
          <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
            <div className="bg-slate-100 px-4 py-3 border-b">
              <div className="h-4 w-16 bg-slate-200 rounded" />
            </div>
            <div className="p-4 space-y-3">
              {["detail-1", "detail-2", "detail-3"].map((id) => (
                <div key={id} className="flex justify-between py-1">
                  <div className="h-4 w-24 bg-slate-200 rounded" />
                  <div className="h-4 w-20 bg-slate-200 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
