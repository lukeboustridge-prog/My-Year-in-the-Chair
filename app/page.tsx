import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-6">
      <section className="card">
        <h1 className="text-2xl font-semibold mb-2">Welcome</h1>
        <p>Track lodge visits, earn points, and see how you rank across Masters using this app.</p>
        <div className="mt-4 flex gap-3">
          <Link href="/auth" className="btn btn-primary">Get started</Link>
          <Link href="/leaderboard" className="btn">View leaderboard</Link>
        </div>
      </section>
      <section className="card">
        <h2 className="text-xl font-semibold mb-2">What you can do</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Log visits and notes</li>
          <li>Earn badges and points</li>
          <li>Compete on the visitor leaderboard</li>
          <li>Browse Master’s resources</li>
        </ul>
      </section>
    </div>
  );
}
