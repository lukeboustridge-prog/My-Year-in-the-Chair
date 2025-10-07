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
  const [leaderboard, setLeaderboard] = React.useState<{
    monthRank: number | null;
    monthVisits: number;
    yearRank: number | null;
    yearVisits: number;
  } | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/profile', { credentials: 'include' });
        const data = await res.json().catch(() => ({}));
        if (!cancelled) setProfile(data || {});
      } catch {
        if (!cancelled) setProfile({});
      }
      try {
        const res = await fetch('/api/visits', { credentials: 'include' });
        const data = await res.json().catch(() => []);
        if (!cancelled) setVisits(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setVisits([]);
      }
      try {
        const res = await fetch('/api/workings', { credentials: 'include' });
        const data = await res.json().catch(() => []);
        if (!cancelled) setWorkings(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setWorkings([]);
      }
      try {
        const res = await fetch('/api/leaderboard/rank', { credentials: 'include' });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        if (!cancelled) setLeaderboard(data);
      } catch {
        if (!cancelled) setLeaderboard(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const nameLine =
    [profile?.prefix, profile?.fullName || profile?.name, profile?.postNominals]
      .filter(Boolean)
      .join(' ') || 'Brother';

  const recentVisits = visits.slice(0, 5);
  const recentWorkings = workings.slice(0, 5);

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card"><div className="card-body">
          <div className="subtle mb-1">Total Visits</div>
          <div className="text-2xl font-semibold">{visits.length || '—'}</div>
        </div></div>
        <div className="card"><div className="card-body">
          <div className="subtle mb-1">Rolling 12 Months Rank</div>
          <div className="text-2xl font-semibold">
            {leaderboard?.yearRank ? `#${leaderboard.yearRank}` : '—'}
          </div>
          <div className="text-sm text-slate-500 mt-1">
            {leaderboard?.yearVisits ? `${leaderboard.yearVisits} visits` : 'No visits recorded'}
          </div>
        </div></div>
        <div className="card"><div className="card-body">
          <div className="subtle mb-1">This Month Rank</div>
          <div className="text-2xl font-semibold">
            {leaderboard?.monthRank ? `#${leaderboard.monthRank}` : '—'}
          </div>
          <div className="text-sm text-slate-500 mt-1">
            {leaderboard?.monthVisits ? `${leaderboard.monthVisits} visits` : 'No visits recorded'}
          </div>
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
                  {recentVisits.length === 0 ? (
                    <tr className="border-t"><td className="py-2 pr-3" colSpan={4}>No recent visits.</td></tr>
                  ) : recentVisits.map(v => (
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
                  {recentWorkings.length === 0 ? (
                    <tr className="border-t"><td className="py-2 pr-3" colSpan={4}>No recent records.</td></tr>
                  ) : recentWorkings.map(w => (
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