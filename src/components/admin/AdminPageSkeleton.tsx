export type AdminSkeletonVariant = "default" | "table" | "memberLogs";

export function AdminPageSkeleton({ variant = "default" }: { variant?: AdminSkeletonVariant }) {
  return (
    <div className="card overflow-hidden animate-pulse" aria-busy="true" aria-label="Loading">
      <div className="flex flex-col gap-4 border-b border-neutral-100 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-8 w-56 rounded-lg bg-neutral-200" />
          <div className="h-4 w-72 max-w-full rounded bg-neutral-100" />
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="h-11 w-40 rounded-xl bg-neutral-200" />
          <div className="h-11 w-36 rounded-xl bg-neutral-200" />
          {variant === "memberLogs" && <div className="h-11 w-28 rounded-xl bg-neutral-200" />}
        </div>
      </div>

      <div className="p-5">
        <div className="mb-5 flex gap-3 border-b border-neutral-100 pb-4">
          <div className="h-9 w-9 rounded-full bg-neutral-200" />
          <div className="space-y-2 pt-1">
            <div className="h-5 w-40 rounded bg-neutral-200" />
            <div className="h-4 w-64 rounded bg-neutral-100" />
          </div>
        </div>

        {variant !== "default" && (
          <div className={`mb-6 grid gap-0 overflow-hidden rounded-xl border border-neutral-200 ${variant === "memberLogs" ? "grid-cols-6" : "grid-cols-4"}`}>
            {(variant === "memberLogs" ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4]).map((i) => (
              <div key={i} className="border-r border-neutral-100 px-2 py-4 last:border-r-0">
                <div className="mx-auto h-8 w-12 rounded bg-neutral-200" />
                <div className="mx-auto mt-2 h-3 w-16 rounded bg-neutral-100" />
              </div>
            ))}
          </div>
        )}

        <div className="mb-3 h-3 w-32 rounded bg-neutral-100" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-14 rounded-xl border border-neutral-100 bg-neutral-50" />
          ))}
        </div>
      </div>
    </div>
  );
}
