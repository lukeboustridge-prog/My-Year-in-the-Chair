'use client';
import React from "react";
import Link from "next/link";
import { toDisplayDate } from "../lib/date";

type Profile = {
  prefix?: string;
  fullName?: string;
  name?: string;
  postNominals?: string;
};
type Visit = {
  id?: string;
  date?: string;
  dateISO?: string;
  lodgeName?: string;
  lodgeNumber?: string;
  workOfEvening?: string;
  eventType?: string;
  grandLodgeVisit?: boolean;
};
type Working = {
  id?: string;
  meetingDate?: string | null;
  work?: string;
  candidateName?: string | null;
  lecture?: string | null;
  tracingBoard1?: boolean | null;
  tracingBoard2?: boolean | null;
  tracingBoard3?: boolean | null;
  notes?: string | null;
};

const WORK_LABELS: Record<string, string> = {
  INITIATION: "Initiation",
  PASSING: "Passing",
  RAISING: "Raising",
  INSTALLATION: "Installation",
  PRESENTATION: "Presentation",
  LECTURE: "Lecture",
  OTHER: "Other",
};

export default function HomePage() {
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [visits, setVisits] = React.useState<Visit[]>([]);
  const [workings, setWorkings] = React.useState<Working[]>([]);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/profile', { credentials: 'include' });
        const data = await res.json().catch(()=> ({}));
        setProfile(data || {});
      } catch { setProfile({}); }
      try {
        const res = await fetch('/api/visits?limit=5', { credentials: 'include' });
        const data = await res.json().catch(()=> []);
        setVisits(Array.isArray(data) ? data : []);
      } catch { setVisits([]); }
      try {
        const res = await fetch('/api/workings?limit=5', { credentials: 'include' });
        const data = await res.json().catch(()=> []);
        setWorkings(Array.isArray(data) ? data : []);
      } catch { setWorkings([]); }
    })();
  }, []);

  const nameLine =
    [profile?.prefix, profile?.fullName || profile?.name, profile?.postNominals]
      .filter(Boolean)
      .join(' ') || 'Brother';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="h1">Dashboard</h1>
          <p className="subtle mt-1">Welcome, {nameLine}.</p>
        </div>
        {/* Removed Add Visit/Add Working per request; actions live on their pages */}
        <div className="flex flex-wrap gap-2">
          <Link href="/reports" className="btn-soft">Export Report</Link>
        </div>
      </div>

      {/* Profile quick card */}
      <div className="card">
        <div className="card-body flex items-center justify-between">
          <div>
            <div className="subtle mb-0.5">Signed in as</div>
            <div className="text-base font-medium">{nameLine}</div>
          </div>
          <Link href="/profile" className="navlink">Edit Profile</Link>
        </div>
      </div>

      {/* Stats row (removed Offices Held) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card"><div className="card-body">
          <div className="subtle mb-1">Total Visits</div>
          <div className="text-2xl font-semibold">{visits.length || '—'}</div>
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
                  {visits.length === 0 ? (
                    <tr className="border-t"><td className="py-2 pr-3" colSpan={4}>No recent visits.</td></tr>
                  ) : visits.map(v => (
                    <tr key={v.id || (v.date || v.dateISO || '') + (v.lodgeName || '')} className="border-t">
                      <td className="py-2 pr-3">{toDisplayDate(v.date || v.dateISO || '')}</td>
                      <td className="py-2 pr-3">{v.lodgeName || '—'}</td>
                      <td className="py-2 pr-3">{v.workOfEvening || v.eventType || '—'}</td>
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
                    <th className="py-2 pr-3">Work</th>
                    <th className="py-2 pr-3">Candidate</th>
                    <th className="py-2 pr-3">Lecture</th>
                  </tr>
                </thead>
                <tbody>
                  {workings.length === 0 ? (
                    <tr className="border-t"><td className="py-2 pr-3" colSpan={4}>No recent records.</td></tr>
                  ) : workings.map(w => (
                    <tr key={w.id || (w.meetingDate || '') + (w.work || '')} className="border-t">
                      <td className="py-2 pr-3">{toDisplayDate(w.meetingDate || '')}</td>
                      <td className="py-2 pr-3">{WORK_LABELS[w.work || ''] || w.work || '—'}</td>
                      <td className="py-2 pr-3">{w.candidateName || '—'}</td>
                      <td className="py-2 pr-3">{w.lecture || '—'}</td>
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