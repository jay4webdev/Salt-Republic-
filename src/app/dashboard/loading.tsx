export default function DashboardLoading() {
  return (
    <div aria-hidden className="animate-pulse">
      <div className="mb-8 h-10 w-56 bg-navy-900/10" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 border border-navy-900/10 bg-white" />
        ))}
      </div>
      <div className="mt-8 h-96 border border-navy-900/10 bg-white" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
