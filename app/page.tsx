'use client';
import React from "react";
import Link from "next/link";
import Modal from "../components/Modal";
import { deriveTitle, RANK_META, RANK_OPTIONS } from "../lib/constants";
import { toDisplayDate } from "../lib/date";

const REGION_OPTIONS = Array.from({ length: 9 }, (_, idx) => `Region ${idx + 1}`);

type Profile = {
  prefix?: string | null;
  fullName?: string | null;
  name?: string | null;
  postNominals?: string[] | string | null;
  rank?: string | null;
  isPastGrand?: boolean | null;
  lodgeName?: string | null;
  lodgeNumber?: string | null;
  region?: string | null;
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
  grandLodgeVisit?: boolean | null;
  emergencyMeeting?: boolean | null;
  tracingBoard1?: boolean | null;
  tracingBoard2?: boolean | null;
  tracingBoard3?: boolean | null;
  notes?: string | null;
};

type ProfileFormState = {
  name: string;
  rank: string;
  isPastGrand: boolean;
  prefix: string;
  postNominals: string[];
  lodgeName: string;
  lodgeNumber: string;
  region: string;
};

function normalisePostNominals(value: Profile["postNominals"]): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
  }
  return [];
}

function normaliseProfile(raw: any): Profile {
  if (!raw || typeof raw !== "object") {
    return {};
  }
  return {
    ...raw,
    postNominals: normalisePostNominals(raw.postNominals),
  };
}

const WORK_LABELS: Record<string, string> = {
  INITIATION: "Initiation",
  PASSING: "Passing",
  RAISING: "Raising",
  INSTALLATION: "Installation",
  PRESENTATION: "Presentation",
  LECTURE: "Lecture",
  OTHER: "Other",
};

function formatWorkLabel(value?: string | null) {
  if (!value) return "—";
  if (value in WORK_LABELS) {
    return WORK_LABELS[value];
  }
  if (value === value.toUpperCase()) {
    return value
      .toLowerCase()
      .split(' ')
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function HomePage() {
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [profileModalOpen, setProfileModalOpen] = React.useState(false);
  const [profileForm, setProfileForm] = React.useState<ProfileFormState | null>(null);
  const [profileSaving, setProfileSaving] = React.useState(false);
  const [profileError, setProfileError] = React.useState<string | null>(null);
  const [visits, setVisits] = React.useState<Visit[]>([]);
  const [workings, setWorkings] = React.useState<Working[]>([]);
  const [leaderboard, setLeaderboard] = React.useState<{
    monthRank: number | null;
    monthVisits: number;
    yearRank: number | null;
    yearVisits: number;
  } | null>(null);

  const grandRankOptions = React.useMemo(
    () => RANK_OPTIONS.filter((rank) => RANK_META[rank]?.grand),
    [],
  );

  React.useEffect(() => {
    if (!profileForm) return;
    const derived = deriveTitle(profileForm.rank, profileForm.isPastGrand);
    const nextPostNominals = derived.postNominals;
    if (
      derived.prefix !== profileForm.prefix ||
      nextPostNominals.join("|") !== profileForm.postNominals.join("|")
    ) {
      setProfileForm((prev) =>
        prev
          ? {
              ...prev,
              prefix: derived.prefix,
              postNominals: nextPostNominals,
            }
          : prev,
      );
    }
  }, [profileForm?.rank, profileForm?.isPastGrand]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/profile', { credentials: 'include' });
        const data = res.ok ? await res.json().catch(() => ({})) : {};
        if (!cancelled) setProfile(normaliseProfile(data));
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

  const openProfileModal = React.useCallback(() => {
    const base: Profile = profile ?? {};
    const initialRank =
      typeof base.rank === 'string' && base.rank.trim()
        ? base.rank
        : 'Master Mason';
    const initialPastGrand = Boolean(base.isPastGrand);
    const derived = deriveTitle(initialRank, initialPastGrand);
    const storedPostNominals = normalisePostNominals(base.postNominals);
    setProfileForm({
      name:
        typeof base.fullName === 'string' && base.fullName.trim().length > 0
          ? base.fullName
          : typeof base.name === 'string'
          ? base.name
          : '',
      rank: initialRank,
      isPastGrand: initialPastGrand,
      prefix:
        typeof base.prefix === 'string' && base.prefix.trim().length > 0
          ? base.prefix
          : derived.prefix,
      postNominals:
        storedPostNominals.length > 0 ? storedPostNominals : derived.postNominals,
      lodgeName: typeof base.lodgeName === 'string' ? base.lodgeName : '',
      lodgeNumber: typeof base.lodgeNumber === 'string' ? base.lodgeNumber : '',
      region: typeof base.region === 'string' ? base.region : '',
    });
    setProfileError(null);
    setProfileModalOpen(true);
  }, [profile]);

  const handlePastGrandChange = React.useCallback(
    (checked: boolean) => {
      setProfileForm((prev) => {
        if (!prev) return prev;
        const nextRank =
          checked && !RANK_META[prev.rank]?.grand
            ? grandRankOptions[0] ?? prev.rank
            : prev.rank;
        return {
          ...prev,
          isPastGrand: checked,
          rank: nextRank,
        };
      });
    },
    [grandRankOptions],
  );

  const closeProfileModal = React.useCallback(() => {
    if (profileSaving) return;
    setProfileModalOpen(false);
    setProfileForm(null);
    setProfileError(null);
  }, [profileSaving]);

  const saveProfile = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!profileForm) return;
      setProfileSaving(true);
      setProfileError(null);
      const payload = {
        name: profileForm.name.trim() || undefined,
        rank: profileForm.rank,
        isPastGrand: profileForm.isPastGrand,
        prefix: profileForm.prefix,
        postNominals: profileForm.postNominals,
        lodgeName: profileForm.lodgeName.trim() || undefined,
        lodgeNumber: profileForm.lodgeNumber.trim() || undefined,
        region: profileForm.region || undefined,
      };
      try {
        const res = await fetch('/api/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          throw new Error(await res.text());
        }
        const nextProfile: Profile = {
          ...(profile ?? {}),
          name: payload.name ?? null,
          fullName: payload.name ?? null,
          rank: payload.rank,
          isPastGrand: payload.isPastGrand,
          prefix: payload.prefix,
          postNominals: payload.postNominals,
          lodgeName: payload.lodgeName ?? null,
          lodgeNumber: payload.lodgeNumber ?? null,
          region: payload.region ?? null,
        };
        setProfile(nextProfile);
        setProfileModalOpen(false);
        setProfileForm(null);
      } catch (err: any) {
        setProfileError(err?.message || 'Unable to save profile');
      } finally {
        setProfileSaving(false);
      }
    },
    [profileForm, profile],
  );

  const prefixText =
    profile && typeof profile.prefix === 'string' ? profile.prefix.trim() : '';
  const nameText =
    profile && typeof (profile.fullName ?? profile.name) === 'string'
      ? (profile.fullName ?? profile.name ?? '').trim()
      : '';
  const postNominalsText = profile
    ? Array.isArray(profile.postNominals)
      ? profile.postNominals
          .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
          .join(', ')
      : typeof profile.postNominals === 'string'
      ? profile.postNominals.trim()
      : ''
    : '';
  const nameLine =
    [prefixText, nameText, postNominalsText].filter(Boolean).join(' ') || 'Brother';

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
          <button type="button" className="navlink" onClick={openProfileModal}>
            Edit Profile
          </button>
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
                      <td className="py-2 pr-3">{formatWorkLabel(v.workOfEvening || v.eventType)}</td>
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

      <Modal
        open={profileModalOpen}
        title="Edit Profile"
        onClose={closeProfileModal}
      >
        {profileForm && (
          <form className="space-y-4" onSubmit={saveProfile}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="label">
                <span>Name</span>
                <input
                  className="input mt-1"
                  type="text"
                  value={profileForm.name}
                  onChange={(e) =>
                    setProfileForm((prev) =>
                      prev ? { ...prev, name: e.target.value } : prev,
                    )
                  }
                  placeholder="e.g., John Smith"
                  required
                />
              </label>
              <div className="label">
                <span>Past Grand Rank</span>
                <label className="flex items-center gap-2 text-sm font-medium mt-1">
                  <input
                    type="checkbox"
                    checked={profileForm.isPastGrand}
                    onChange={(e) => handlePastGrandChange(e.target.checked)}
                  />
                  <span>Show only Grand ranks (as Past)</span>
                </label>
              </div>
            </div>

            <label className="label">
              <span>Rank</span>
              <select
                className="input mt-1"
                value={profileForm.rank}
                onChange={(e) =>
                  setProfileForm((prev) =>
                    prev ? { ...prev, rank: e.target.value } : prev,
                  )
                }
              >
                {(profileForm.isPastGrand ? grandRankOptions : RANK_OPTIONS).map((rank) => (
                  <option key={rank} value={rank}>
                    {profileForm.isPastGrand && RANK_META[rank]?.grand
                      ? `Past ${rank}`
                      : rank}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="label">
                <span>Lodge Name</span>
                <input
                  className="input mt-1"
                  type="text"
                  value={profileForm.lodgeName}
                  onChange={(e) =>
                    setProfileForm((prev) =>
                      prev ? { ...prev, lodgeName: e.target.value } : prev,
                    )
                  }
                  placeholder="e.g., Lodge Example"
                />
              </label>
              <label className="label">
                <span>Lodge Number</span>
                <input
                  className="input mt-1"
                  type="text"
                  value={profileForm.lodgeNumber}
                  onChange={(e) =>
                    setProfileForm((prev) =>
                      prev ? { ...prev, lodgeNumber: e.target.value } : prev,
                    )
                  }
                  placeholder="e.g., No. 123"
                />
              </label>
            </div>

            <label className="label">
              <span>Region</span>
              <select
                className="input mt-1"
                value={profileForm.region}
                onChange={(e) =>
                  setProfileForm((prev) =>
                    prev ? { ...prev, region: e.target.value } : prev,
                  )
                }
              >
                <option value="">Select region</option>
                {REGION_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            {profileError && (
              <p className="text-sm text-red-600">{profileError}</p>
            )}

            <div className="flex justify-end gap-3 pt-1">
              <button
                type="button"
                className="btn-soft"
                onClick={closeProfileModal}
                disabled={profileSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={profileSaving}
              >
                {profileSaving ? 'Saving…' : 'Save Profile'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
