'use client';
import React from "react";
import Link from "next/link";
import { toDisplayDate, toISODate } from "../lib/date";

type Profile = {
  prefix?: string;
  name?: string;
  fullName?: string;
  postNominals?: string | string[];
};
type Visit = { id?: string; dateISO?: string; lodgeName?: string; lodgeNumber?: string; eventType?: string; grandLodgeVisit?: boolean };
type Working = { id?: string; dateISO?: string; degree?: string; candidateName?: string; grandLodgeVisit?: boolean };

type LeaderboardEntry = { rank: number; visits: number; name?: string; userId?: string };
type LeaderboardBucket = { leaders?: LeaderboardEntry[]; user?: (LeaderboardEntry | null) } | null;
type LeaderboardState = { rollingYear?: LeaderboardBucket; rollingMonth?: LeaderboardBucket } | null;

type WorkType = 'INITIATION' | 'PASSING' | 'RAISING' | 'INSTALLATION' | 'PRESENTATION' | 'LECTURE' | 'OTHER';

const workTypeToLabel: Record<WorkType, string> = {
  INITIATION: 'Initiation',
  PASSING: 'Passing',
  RAISING: 'Raising',
  INSTALLATION: 'Installation',
  PRESENTATION: 'Other',
  LECTURE: 'Lecture',
  OTHER: 'Other',
};

function visitLabelFromWorkType(value?: string) {
  const key = (value || '').toUpperCase() as WorkType;
  return workTypeToLabel[key] ?? 'Other';
}

function degreeFromWorkType(value?: string) {
  const key = (value || '').toUpperCase() as WorkType;
  switch (key) {
    case 'INITIATION':
      return 'Initiation';
    case 'PASSING':
      return 'Passing';
    case 'RAISING':
      return 'Raising';
    case 'INSTALLATION':
      return 'Installation';
    case 'LECTURE':
      return 'Lecture';
    default:
      return 'Other';
  }
}

function normalizeVisit(raw: any): Visit {
  const grandLodgeValue = raw?.grandLodgeVisit ?? raw?.isGrandLodgeVisit ?? raw?.grand_lodge_visit;
  return {
    id: raw?.id,
    dateISO: toISODate(raw?.dateISO ?? raw?.date ?? ''),
    lodgeName: raw?.lodgeName ?? raw?.lodge ?? '',
    lodgeNumber: raw?.lodgeNumber ?? raw?.lodgeNo ?? '',
    eventType: visitLabelFromWorkType(raw?.workOfEvening ?? raw?.eventType ?? raw?.degree),
    grandLodgeVisit: typeof grandLodgeValue === 'string'
      ? grandLodgeValue === 'true'
      : Boolean(grandLodgeValue),
  };
}

function normalizeWorking(raw: any): Working {
  const grandLodgeValue = raw?.grandLodgeVisit ?? raw?.isGrandLodgeVisit ?? raw?.grand_lodge_visit;
  return {
    id: raw?.id,
    dateISO: toISODate(raw?.dateISO ?? raw?.date ?? ''),
    degree: degreeFromWorkType(raw?.work ?? raw?.degree),
    candidateName: raw?.candidateName ?? raw?.section ?? '',
    grandLodgeVisit: typeof grandLodgeValue === 'string'
      ? grandLodgeValue === 'true'
      : Boolean(grandLodgeValue),
  };
}

export default function HomePage() {
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [visits, setVisits] = React.useState<Visit[]>([]);
  const [workings, setWorkings] = React.useState<Working[]>([]);
  const [leaderboard, setLeaderboard] = React.useState<LeaderboardState>(null);

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
        setVisits(Array.isArray(data) ? data.map(normalizeVisit) : []);
      } catch { setVisits([]); }
      try {
        const res = await fetch('/api/mywork?limit=5', { credentials: 'include' });
        const data = await res.json().catch(()=> []);
        setWorkings(Array.isArray(data) ? data.map(normalizeWorking) : []);
      } catch { setWorkings([]); }
      try {
        const res = await fetch('/api/leaderboard', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to load leaderboard');
        const data = await res.json().catch(() => null);
        setLeaderboard(data || {});
      } catch {
        setLeaderboard({});
      }
    })();
  }, []);

  const displayName = profile?.fullName || profile?.name || '';
  const postNominals = Array.isArray(profile?.postNominals)
    ? profile?.postNominals.join(', ')
    : profile?.postNominals;
  const nameLine = [profile?.prefix, displayName, postNominals].filter(Boolean).join(' ') || 'Brother';

  const rollingYearRank = leaderboard?.rollingYear?.user?.rank;
  const rollingYearVisits = leaderboard?.rollingYear?.user?.visits;
  const rollingMonthRank = leaderboard?.rollingMonth?.user?.rank;
  const rollingMonthVisits = leaderboard?.rollingMonth?.user?.visits;

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
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold">
                {typeof rollingYearRank === 'number' ? `#${rollingYearRank}` : '—'}
              </span>
              <span className="text-sm text-slate-500">
                Rolling 12 months
                {typeof rollingYearVisits === 'number' ? ` • ${rollingYearVisits} visits` : ''}
              </span>
            </div>
            <div className="flex items-baseline gap-2 text-slate-600">
              <span className="text-xl font-semibold">
                {typeof rollingMonthRank === 'number' ? `#${rollingMonthRank}` : '—'}
              </span>
              <span className="text-sm">
                This month
                {typeof rollingMonthVisits === 'number' ? ` • ${rollingMonthVisits} visits` : ''}
              </span>
            </div>
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
                  {visits.length === 0 ? (
                    <tr className="border-t"><td className="py-2 pr-3" colSpan={4}>No recent visits.</td></tr>
                  ) : visits.map(v => (
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
                    <th className="py-2 pr-3">Candidate</th>
                    <th className="py-2 pr-3">GL Visit</th>
                  </tr>
                </thead>
                <tbody>
                  {workings.length === 0 ? (
                    <tr className="border-t"><td className="py-2 pr-3" colSpan={4}>No recent records.</td></tr>
                  ) : workings.map(w => (
                    <tr key={w.id || (w.dateISO || '') + (w.candidateName || '')} className="border-t">
                      <td className="py-2 pr-3">{toDisplayDate(w.dateISO || '')}</td>
                      <td className="py-2 pr-3">{w.degree || '—'}</td>
                      <td className="py-2 pr-3">{w.candidateName || '—'}</td>
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