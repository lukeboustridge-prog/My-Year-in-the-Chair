export default function PendingApprovalNotice({
  title = "Awaiting approval",
  message = "Your registration is pending administrator approval. You can continue recording your own activity, but shared views like the leaderboard will unlock once you have been approved.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div className="card">
      <div className="card-body space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-600">{message}</p>
      </div>
    </div>
  );
}
