// app/page.tsx — Dashboard (valid default export)
'use client';
import React from "react";
import Link from "next/link";
import { toDisplayDate } from "../lib/date";
import { getProfileName, getVisits, getWorkings, getOwnRanks } from "../lib/api";

export default function HomePage() {
  const [nameLine, setNameLine] = React.useState<string>('Brother');
  const [visits, setVisits] = React.useState<any[]>([]);
  const [workings, setWorkings] = React.useState<any[]>([]);
  const [ranks, setRanks] = React.useState<{rank12?: number; rankM?: number; points12?: number; pointsM?: number; name: string;} | null>(null);

  React.useEffect(() => {
    (async () => {
      setNameLine(await getProfileName());
      setVisits(await getVisits(5));
      setWorkings(await getWorkings(5));
      setRanks(await getOwnRanks());
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="h1">Dashboard</h1>
          <p className="subtle mt-1">Welcome, {nameLine}.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/reports" className="btn-soft">Export Report</Link>
        </div>
      </div>

      <div className="card">
        <div className="card-body grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
          <div className="flex items-baseline gap-3">
            <div>
              <div className="subtle mb-0.5">Signed in as</div>
              <div className="text-base font-medium">{nameLine}</div>
            </div>
            <Link href="/profile" className="navlink">Edit profile</Link>
          </div>
          <div className="border-t sm:border-t-0 sm:border-l sm:pl-4 pt-3 sm:pt-0">
            <div className="subtle mb-0.5">Rolling 12 months</div>
            <div className="text-base font-medium">{ranks?.rank12 !== undefined ? `Rank #${ranks.rank12}` : '—'}</div>
          </div>
          <div className="border-t sm:border-t-0 sm:border-l sm:pl-4 pt-3 sm:pt-0">
            <div className="subtle mb-0.5">This month</div>
            <div className="text-base font-medium">{ranks?.rankM !== undefined ? `Rank #${ranks.rankM}` : '—'}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card"><div className="card-body">
          <div className="subtle mb-1">Total Visits (last 5 loaded)</div>
          <div className="text-2xl font-semibold">{visits?.length || '—'}</div>
        </div></div>
        <div className="card"><div className="card-body">
          <div className="subtle mb-1">Total Workings (last 5 loaded)</div>
          <div className="text-2xl font-semibold">{workings?.length || '—'}</div>
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
                  {visits.length === 0 ? (
                    <tr className="border-t"><td className="py-2 pr-3" colSpan={4}>No recent visits.</td></tr>
                  ) : visits.map((v:any) => (
                    <tr key={v.id || (v.dateISO || '') + (v.lodgeName || '')} className="border-t">
                      <td className="py-2 pr-3">{toDisplayDate(v.dateISO || '')}</td>
                      <td className="py-2 pr-3">{v.lodgeName || '—'}</td>
                      <td className="py-2 pr-3">{v.eventType || '—'}</td>
                      <td className="py-2 pr-3">{v.grandLodgeVisit ? 'Yes' : 'No'}</td>
                    </tr>
                  ))}
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
                  {workings.length === 0 ? (
                    <tr className="border-t"><td className="py-2 pr-3" colSpan={4}>No recent records.</td></tr>
                  ) : workings.map((w:any) => (
                    <tr key={w.id || (w.dateISO || '') + (w.section || '')} className="border-t">
                      <td className="py-2 pr-3">{toDisplayDate(w.dateISO || '')}</td>
                      <td className="py-2 pr-3">{w.degree || '—'}</td>
                      <td className="py-2 pr-3">{w.section || '—'}</td>
                      <td className="py-2 pr-3">{w.grandLodgeVisit ? 'Yes' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}