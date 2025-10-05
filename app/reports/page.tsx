export const dynamic = "force-dynamic";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">End-of-term report</h1>
      <p className="text-sm text-gray-500">
        Generate a CSV report of your visits for your term as Master (or last 12 months if no term is set).
      </p>
      <a href="/api/reports/term" className="btn btn-primary inline-block">Download CSV report</a>
      <p className="text-xs text-gray-500">Attach this report when emailing your Grand Superintendent or Region.</p>
    </div>
  );
}
