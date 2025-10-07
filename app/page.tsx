'use client';
import React from "react";
import Link from "next/link";
import { toDisplayDate } from "../lib/date";

type Profile = { prefix?: string; fullName?: string; postNominals?: string };
type Visit = {
  id: string;
  date?: string;
  lodgeName?: string;
  work?: string;
  region?: string;
  comments?: string;
};
type Working = {
  id: string;
  date?: string;
  work?: string;
  candidateName?: string;
  comments?: string;
};

export default function HomePage() {
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [visits, setVisits] = React.useState<Visit[]>([]);
  const [workings, setWorkings] = React.useState<Working[]>([]);
  const [visitTotal, setVisitTotal] = React.useState<number | null>(null);
  const [workTotal, setWorkTotal] = React.useState<number | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/profile', { credentials: 'include' });
        const data = await res.json().catch(()=> ({}));
        setProfile(data || {});
      } catch { setProfile({}); }
      try {
        const res = await fetch('/api/visits', { credentials: 'include' });
        const data = await res.json().catch(()=> []);
        const mapped = (Array.isArray(data) ? data : []).map((v: any, index: number) => ({
          id: v.id || `visit-${index}`,
          date: v.date || v.dateISO || v.dateString,
          lodgeName: v.lodgeName || v.lodge || '',
          work: v.workOfEvening || v.eventType || v.degree || '',
          region: v.region || '',
          comments: v.comments || v.notes || '',
        }));
        setVisitTotal(mapped.length);
        setVisits(mapped.slice(0, 5));
      } catch {
        setVisitTotal(0);
        setVisits([]);
      }
      try {
        const res = await fetch('/api/my-work', { credentials: 'include' });
        const data = await res.json().catch(()=> []);
        const mapped = (Array.isArray(data) ? data : []).map((w: any, index: number) => ({
          id: w.id || `work-${index}`,
          date: w.date || w.dateISO || w.dateString,
          work: w.work || w.eventType || w.degree || '',
          candidateName: w.candidateName || '',
          comments: w.comments || w.notes || '',
        }));
        setWorkTotal(mapped.length);
        setWorkings(mapped.slice(0, 5));
      } catch {
        setWorkTotal(0);
        setWorkings([]);
      }
    })();
  }, []);

  const nameLine = [profile?.prefix, profile?.fullName, profile?.postNominals].filter(Boolean).join(' ') || 'Brother';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="h1">Dashboard</h1>
          <p className="subtle mt-1">Welcome, {nameLine}.</p>
        </div>
        {/* Removed Add Visit/Add Working per request; actions live on their pages */}
        <div className="flex flex-wrap gap-2">
          <Link href="/profile" className="btn-soft">Edit Profile</Link>
        </div>
      </div>

      {/* Stats row (removed Offices Held) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card"><div className="card-body">
          <div className="subtle mb-1">Total Visits</div>
          <div className="text-2xl font-semibold">{visitTotal ?? '—'}</div>
        </div></div>
        <div className="card"><div className="card-body">
          <div className="subtle mb-1">Lodge Work Logged</div>
          <div className="text-2xl font-semibold">{workTotal ?? '—'}</div>
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
                    <th className="py-2 pr-3">Region</th>
                    <th className="py-2 pr-3">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {visits.length === 0 ? (
                    <tr className="border-t"><td className="py-2 pr-3" colSpan={5}>No recent visits.</td></tr>
                  ) : visits.map(v => (
                    <tr key={v.id} className="border-t">
                      <td className="py-2 pr-3">{toDisplayDate(v.date || '')}</td>
                      <td className="py-2 pr-3">{v.lodgeName || '—'}</td>
                      <td className="py-2 pr-3 capitalize">{v.work || '—'}</td>
                      <td className="py-2 pr-3">{v.region || '—'}</td>
                      <td className="py-2 pr-3">{v.comments || '—'}</td>
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
                    <th className="py-2 pr-3">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {workings.length === 0 ? (
                    <tr className="border-t"><td className="py-2 pr-3" colSpan={4}>No recent records.</td></tr>
                  ) : workings.map(w => (
                    <tr key={w.id} className="border-t">
                      <td className="py-2 pr-3">{toDisplayDate(w.date || '')}</td>
                      <td className="py-2 pr-3 capitalize">{w.work || '—'}</td>
                      <td className="py-2 pr-3">{w.candidateName || '—'}</td>
                      <td className="py-2 pr-3">{w.comments || '—'}</td>
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