/** Lightweight shell while member routes load (instant navigation + deferred content). */
export default function MemberPageSkeleton() {
  return (
    <div className="min-h-screen animate-pulse bg-neutral-50 p-4 pb-28" aria-busy="true" aria-label="Loading">
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="h-7 w-44 rounded-lg bg-neutral-200" />
        <div className="h-52 rounded-2xl border border-neutral-200 bg-white" />
        <div className="h-36 rounded-2xl border border-neutral-200 bg-white" />
      </div>
    </div>
  );
}
