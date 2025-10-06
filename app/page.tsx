'use client';
import React from "react";
import Link from "next/link";

type Profile = { fullName?: string };

export default function HomePage() {
  const [profile, setProfile] = React.useState<Profile | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/profile', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to load profile');
        const data = await res.json();
        setProfile(data || {});
      } catch {
        setProfile({ fullName: undefined });
      }
    })();
  }, []);

  const displayName = profile?.fullName || "Brother";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="h1">Dashboard</h1>
          <p className="subtle mt-1">Welcome, {displayName}.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/visits" className="btn-primary">Add Visit</Link>
          <Link href="/my-work" className="btn-soft">Add Lodge Working</Link>
          <Link href="/reports" className="btn-soft">Export Report</Link>
        </div>
      </div>

      {/* Profile quick card */}
      <div className="card">
        <div className="card-body flex items-center justify-between">
          <div>
            <div className="subtle mb-0.5">Signed in as</div>
            <div className="text-base font-medium">{displayName}</div>
          </div>
          <Link href="/profile" className="navlink">Edit Profile</Link>
        </div>
      </div>

      {/* Stats row (removed Offices Held) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card"><div className="card-body">
          <div className="subtle mb-1">Total Visits</div>
          <div className="text-2xl font-semibold">—</div>
        </div></div>
        <div className="card"><div className="card-body">
          <div className="subtle mb-1">Leaderboard Rank</div>
          <div className="text-2xl font-semibold">—</div>
        </div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Recent Visits</h2>
              <Link href="/visits" className="navlink">Manage</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="py-2 pr-3">Date</th>
                    <th className="py-2 pr-3">Lodge</th>
                    <th className="py-2 pr-3">Work</th>
                    <th className="py-2 pr-3">GL Visit</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="py-2 pr-3">—</td>
                    <td className="py-2 pr-3">—</td>
                    <td className="py-2 pr-3">—</td>
                    <td className="py-2 pr-3">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Recent Lodge Workings</h2>
              <Link href="/my-work" className="navlink">Manage</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="py-2 pr-3">Date</th>
                    <th className="py-2 pr-3">Degree</th>
                    <th className="py-2 pr-3">Section</th>
                    <th className="py-2 pr-3">GL Visit</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="py-2 pr-3">—</td>
                    <td className="py-2 pr-3">—</td>
                    <td className="py-2 pr-3">—</td>
                    <td className="py-2 pr-3">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}