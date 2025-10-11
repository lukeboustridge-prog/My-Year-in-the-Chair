"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import { RANK_META, RANK_OPTIONS, deriveTitle, type Rank } from "@/lib/constants";
import { REGIONS } from "@/lib/regions";
import {
  ACHIEVEMENT_MILESTONES,
  createEmptyMilestones,
  type AchievementMilestoneRecord,
  type LodgeRecord,
  type OfficeRecord,
} from "@/lib/myFreemasonry";

const MILESTONE_KEYS = ACHIEVEMENT_MILESTONES.map((milestone) => milestone.key);

const randomId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10);

type LodgeRow = {
  id: string;
  name: string;
  number: string;
  joinDate: string;
  resignDate: string;
};

type OfficeRow = {
  id: string;
  office: string;
  years: string;
  lodgeId: string;
};

type FormState = {
  name: string;
  rank: Rank;
  isPastGrand: boolean;
  isSittingMaster: boolean;
  lodgeName: string;
  lodgeNumber: string;
  region: string;
  termStart: string;
  termEnd: string;
  initiationDate: string;
  passingDate: string;
  raisingDate: string;
  lodges: LodgeRow[];
  craftOffices: OfficeRow[];
  grandOffices: OfficeRow[];
  achievementMilestones: Record<string, string>;
};

const MILESTONE_YEARS: Record<string, number> = {
  "25_YEAR_BADGE": 25,
  "50_YEAR_BADGE": 50,
  "60_YEAR_BADGE": 60,
  "70_YEAR_BADGE": 70,
};

const AUTO_MILESTONE_KEYS = Object.keys(MILESTONE_YEARS);

const createDefaultForm = (): FormState => ({
  name: "",
  rank: "Master Mason",
  isPastGrand: false,
  isSittingMaster: false,
  lodgeName: "",
  lodgeNumber: "",
  region: "",
  termStart: "",
  termEnd: "",
  initiationDate: "",
  passingDate: "",
  raisingDate: "",
  lodges: [],
  craftOffices: [],
  grandOffices: [],
  achievementMilestones: MILESTONE_KEYS.reduce<Record<string, string>>((acc, key) => {
    acc[key] = "";
    return acc;
  }, {}),
});

const createOfficeRow = (
  initial?: Partial<OfficeRecord & { id?: string | null }>,
): OfficeRow => ({
  id: initial?.id && typeof initial.id === "string" ? initial.id : randomId(),
  office: initial?.office ?? "",
  years: initial?.years ?? "",
  lodgeId: typeof initial?.lodgeId === "string" ? initial.lodgeId : "",
});

const createLodgeRow = (initial?: Partial<LodgeRow>): LodgeRow => ({
  id: initial?.id && typeof initial.id === "string" ? initial.id : randomId(),
  name: initial?.name ?? "",
  number: initial?.number ?? "",
  joinDate: initial?.joinDate ?? "",
  resignDate: initial?.resignDate ?? "",
});

const normaliseOffices = (value: unknown): OfficeRow[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const officeRaw = (entry as { office?: unknown }).office;
      const yearsRaw = (entry as { years?: unknown }).years;
      const lodgeIdRaw = (entry as { lodgeId?: unknown }).lodgeId;
      const office = typeof officeRaw === "string" ? officeRaw.trim() : "";
      const years = typeof yearsRaw === "string" ? yearsRaw.trim() : "";
      const lodgeId = typeof lodgeIdRaw === "string" ? lodgeIdRaw : "";
      if (!office && !years && !lodgeId) return null;
      return createOfficeRow({ office, years, lodgeId });
    })
    .filter((entry): entry is OfficeRow => Boolean(entry));
};

const normaliseLodges = (value: unknown): LodgeRow[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const idRaw = (entry as { id?: unknown }).id;
      const nameRaw = (entry as { name?: unknown }).name;
      const numberRaw = (entry as { number?: unknown }).number;
      const joinDateRaw = (entry as { joinDate?: unknown }).joinDate;
      const resignDateRaw = (entry as { resignDate?: unknown }).resignDate;

      const id = typeof idRaw === "string" && idRaw ? idRaw : randomId();
      const name = typeof nameRaw === "string" ? nameRaw.trim() : "";
      const number = typeof numberRaw === "string" ? numberRaw.trim() : "";
      const joinDate = typeof joinDateRaw === "string" ? joinDateRaw.trim() : "";
      const resignDate = typeof resignDateRaw === "string" ? resignDateRaw.trim() : "";

      if (!name && !number && !joinDate && !resignDate) return null;

      return createLodgeRow({ id, name, number, joinDate, resignDate });
    })
    .filter((entry): entry is LodgeRow => Boolean(entry));
};

const normaliseMilestones = (value: unknown): Record<string, string> => {
  const empty = createEmptyMilestones();
  const result: Record<string, string> = {};
  for (const key of MILESTONE_KEYS) {
    const raw =
      value && typeof value === "object" && !Array.isArray(value)
        ? (value as AchievementMilestoneRecord)[key]
        : null;
    if (typeof raw === "string" && raw) {
      result[key] = raw.slice(0, 10);
    } else {
      result[key] = "";
    }
  }
  for (const key of Object.keys(empty)) {
    if (!(key in result)) {
      result[key] = "";
    }
  }
  return result;
};

const sanitiseLodgesForSave = (rows: LodgeRow[]): LodgeRecord[] =>
  rows
    .map((row) => {
      const name = row.name.trim();
      const number = row.number.trim();
      const joinDate = row.joinDate.trim();
      const resignDate = row.resignDate.trim();
      if (!name) return null;
      const record: LodgeRecord = {
        id: row.id,
        name,
        number: number || null,
      };
      if (joinDate) record.joinDate = joinDate;
      if (resignDate) record.resignDate = resignDate;
      return record;
    })
    .filter((entry): entry is LodgeRecord => Boolean(entry));

type CollapsibleSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  defaultOpen?: boolean;
};

function CollapsibleSection({ title, description, children, defaultOpen = true }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="card overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        onClick={() => setOpen((previous) => !previous)}
        aria-expanded={open}
      >
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          {description ? <p className="text-sm text-slate-600">{description}</p> : null}
        </div>
        <span className="text-2xl font-semibold leading-none text-slate-500" aria-hidden>
          {open ? "−" : "+"}
        </span>
      </button>
      <div className={`card-body space-y-6${open ? "" : " hidden"}`}>{children}</div>
    </section>
  );
}

export default function MyFreemasonryPage() {
  const [form, setForm] = useState<FormState>(() => createDefaultForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await fetch("/api/profile");
        if (!response.ok) {
          throw new Error("Failed to load profile");
        }
        const data = await response.json();
        if (!active) return;
        setForm({
          name: data.name ?? "",
          rank:
            typeof data.rank === "string" && (RANK_OPTIONS as ReadonlyArray<string>).includes(data.rank)
              ? (data.rank as Rank)
              : "Master Mason",
          isPastGrand: Boolean(data.isPastGrand),
          isSittingMaster: Boolean(data.isSittingMaster),
          lodgeName: data.lodgeName ?? "",
          lodgeNumber: data.lodgeNumber ?? "",
          region: data.region ?? "",
          termStart: typeof data.termStart === "string" ? data.termStart.slice(0, 10) : "",
          termEnd: typeof data.termEnd === "string" ? data.termEnd.slice(0, 10) : "",
          initiationDate:
            typeof data.initiationDate === "string" ? data.initiationDate.slice(0, 10) : "",
          passingDate: typeof data.passingDate === "string" ? data.passingDate.slice(0, 10) : "",
          raisingDate: typeof data.raisingDate === "string" ? data.raisingDate.slice(0, 10) : "",
          lodges: normaliseLodges(data.lodges),
          craftOffices: normaliseOffices(data.craftOffices),
          grandOffices: normaliseOffices(data.grandOffices),
          achievementMilestones: normaliseMilestones(data.achievementMilestones),
        });
        setError(null);
      } catch (err) {
        console.error(err);
        if (active) {
          setError("We couldn't load your profile right now. Please refresh and try again.");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const derivedTitles = useMemo(
    () => deriveTitle(form.rank, form.isPastGrand),
    [form.rank, form.isPastGrand],
  );

  const grandRanks = useMemo<Rank[]>(
    () => RANK_OPTIONS.filter((option) => RANK_META[option]?.grand),
    [],
  );

  const rankChoices = useMemo<ReadonlyArray<Rank>>(
    () => (form.isPastGrand ? grandRanks : RANK_OPTIONS) as ReadonlyArray<Rank>,
    [form.isPastGrand, grandRanks],
  );

  const canFlagSittingMaster = useMemo(() => {
    if (form.rank === "Worshipful Master") return false;
    if (form.rank === "Past Master") return true;
    return Boolean(RANK_META[form.rank]?.grand);
  }, [form.rank]);

  useEffect(() => {
    if (!rankChoices.includes(form.rank)) {
      setForm((previous) => ({
        ...previous,
        rank: rankChoices[0] ?? previous.rank,
      }));
    }
  }, [form.rank, rankChoices]);

  useEffect(() => {
    if (!canFlagSittingMaster && form.isSittingMaster) {
      setForm((previous) => ({ ...previous, isSittingMaster: false }));
    }
  }, [canFlagSittingMaster, form.isSittingMaster]);

  useEffect(() => {
    if (!form.initiationDate) {
      setForm((previous) => {
        let changed = false;
        const nextMilestones = { ...previous.achievementMilestones };
        for (const key of AUTO_MILESTONE_KEYS) {
          if (nextMilestones[key]) {
            nextMilestones[key] = "";
            changed = true;
          }
        }
        return changed ? { ...previous, achievementMilestones: nextMilestones } : previous;
      });
      return;
    }

    const match = form.initiationDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return;

    const [, yearRaw, monthRaw, dayRaw] = match;
    const year = Number(yearRaw);
    const month = Number(monthRaw);
    const day = Number(dayRaw);
    if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) return;

    const computed: Record<string, string> = {};
    for (const [key, increment] of Object.entries(MILESTONE_YEARS)) {
      const target = new Date(Date.UTC(year + increment, month - 1, day));
      computed[key] = target.toISOString().slice(0, 10);
    }

    setForm((previous) => {
      let changed = false;
      const nextMilestones = { ...previous.achievementMilestones };
      for (const [key, value] of Object.entries(computed)) {
        if (nextMilestones[key] !== value) {
          nextMilestones[key] = value;
          changed = true;
        }
      }
      return changed ? { ...previous, achievementMilestones: nextMilestones } : previous;
    });
  }, [form.initiationDate]);

  const updateOffice = (
    key: "craftOffices" | "grandOffices",
    id: string,
    field: "office" | "years" | "lodgeId",
    value: string,
  ) => {
    setForm((previous) => ({
      ...previous,
      [key]: previous[key].map((entry) =>
        entry.id === id
          ? {
              ...entry,
              [field]: value,
            }
          : entry,
      ),
    }));
  };

  const removeOffice = (key: "craftOffices" | "grandOffices", id: string) => {
    setForm((previous) => ({
      ...previous,
      [key]: previous[key].filter((entry) => entry.id !== id),
    }));
  };

  const addOffice = (key: "craftOffices" | "grandOffices") => {
    setForm((previous) => ({
      ...previous,
      [key]: [...previous[key], createOfficeRow()],
    }));
  };

  const updateLodge = (id: string, field: "name" | "number" | "joinDate" | "resignDate", value: string) => {
    setForm((previous) => ({
      ...previous,
      lodges: previous.lodges.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              [field]: value,
            }
          : entry,
      ),
    }));
  };

  const removeLodge = (id: string) => {
    setForm((previous) => ({
      ...previous,
      lodges: previous.lodges.filter((entry) => entry.id !== id),
      craftOffices: previous.craftOffices.map((entry) =>
        entry.lodgeId === id ? { ...entry, lodgeId: "" } : entry,
      ),
      grandOffices: previous.grandOffices.map((entry) =>
        entry.lodgeId === id ? { ...entry, lodgeId: "" } : entry,
      ),
    }));
  };

  const addLodge = () => {
    setForm((previous) => ({
      ...previous,
      lodges: [...previous.lodges, createLodgeRow()],
    }));
  };

  const disableInputs = saving || loading;

  const handleCancel = () => {
    if (typeof window === "undefined") return;
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/dashboard";
    }
  };

  const handleSave = async () => {
    if (loading) return;
    setSaving(true);
    setFeedback(null);
    setError(null);

    const lodges = sanitiseLodgesForSave(form.lodges);
    const lodgeIds = new Set(lodges.map((lodge) => lodge.id));

    const sanitiseOffices = (rows: OfficeRow[]): OfficeRecord[] =>
      rows
        .map((row) => {
          const office = row.office.trim();
          const years = row.years.trim();
          const lodgeId = row.lodgeId && lodgeIds.has(row.lodgeId) ? row.lodgeId : "";
          return { office, years, lodgeId };
        })
        .filter((row) => row.office || row.years)
        .map((row) => {
          const record: OfficeRecord = { office: row.office };
          if (row.years) record.years = row.years;
          if (row.lodgeId) record.lodgeId = row.lodgeId;
          return record;
        });

    const craftOffices = sanitiseOffices(form.craftOffices);
    const grandOffices = sanitiseOffices(form.grandOffices);
    const achievementMilestones: AchievementMilestoneRecord = {};
    for (const key of MILESTONE_KEYS) {
      const value = form.achievementMilestones[key]?.trim();
      achievementMilestones[key] = value ? value : null;
    }

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          rank: form.rank,
          isPastGrand: form.isPastGrand,
          isSittingMaster: form.isSittingMaster,
          lodgeName: form.lodgeName.trim(),
          lodgeNumber: form.lodgeNumber.trim(),
          region: form.region.trim(),
          termStart: form.termStart,
          termEnd: form.termEnd,
          initiationDate: form.initiationDate,
          passingDate: form.passingDate,
          raisingDate: form.raisingDate,
          lodges,
          craftOffices,
          grandOffices,
          achievementMilestones,
          prefix: derivedTitles.prefix,
          postNominals: derivedTitles.postNominals,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save profile");
      }

      setFeedback("Your Freemasonry record has been updated.");
      const nextAchievementMilestones = MILESTONE_KEYS.reduce<Record<string, string>>((acc, key) => {
        const value = achievementMilestones[key];
        acc[key] = typeof value === "string" && value ? value : "";
        return acc;
      }, {});
      setForm((previous) => ({
        ...previous,
        lodges: lodges.map((lodge) =>
          createLodgeRow({
            id: lodge.id,
            name: lodge.name,
            number: lodge.number ?? "",
            joinDate: lodge.joinDate ?? "",
            resignDate: lodge.resignDate ?? "",
          }),
        ),
        craftOffices: craftOffices.map((office) => createOfficeRow(office)),
        grandOffices: grandOffices.map((office) => createOfficeRow(office)),
        achievementMilestones: nextAchievementMilestones,
      }));
    } catch (err) {
      console.error(err);
      setError("We couldn't save your changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">My Freemasonry</h1>
        <p className="text-sm text-slate-600">
          Keep your personal details, journey milestones, and achievements up to date in one place.
        </p>
      </div>

      {loading && !error ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          Loading your details…
        </div>
      ) : null}

      {feedback ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          {feedback}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : null}

      <CollapsibleSection
        title="Profile basics"
        description="Update the core information that appears on leaderboards, reports, and approvals."
      >
        <div className="grid gap-4 md:grid-cols-2">
            <label className="stat md:col-span-2">
              <span className="label">Name</span>
              <input
                className="card"
                style={{ padding: ".6rem" }}
                value={form.name}
                disabled={disableInputs}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    name: event.target.value,
                  }))
                }
                placeholder="e.g., John Smith"
              />
            </label>

            <div className="stat md:col-span-2">
              <span className="label">Past Grand Rank</span>
              <label className="card flex items-center gap-3" style={{ padding: ".6rem" }}>
                <input
                  type="checkbox"
                  checked={form.isPastGrand}
                  disabled={disableInputs}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      isPastGrand: event.target.checked,
                    }))
                  }
                />
                <span className="muted">Show only Grand ranks (as Past)</span>
              </label>
            </div>

            <label className="stat md:col-span-2">
              <span className="label">Rank</span>
              <select
                className="card"
                style={{ padding: ".6rem" }}
                value={form.rank}
                disabled={disableInputs}
                onChange={(event) => {
                  const value = event.target.value;
                  if ((RANK_OPTIONS as ReadonlyArray<string>).includes(value)) {
                    setForm((previous) => ({
                      ...previous,
                      rank: value as Rank,
                    }));
                  }
                }}
              >
                {rankChoices.map((rank) => (
                  <option key={rank} value={rank}>
                    {form.isPastGrand && RANK_META[rank]?.grand ? `Past ${rank}` : rank}
                  </option>
                ))}
              </select>
            </label>

            {canFlagSittingMaster ? (
              <label className="stat md:col-span-2">
                <span className="label">Also sitting as Worshipful Master</span>
                <label className="card flex items-center gap-3" style={{ padding: ".6rem" }}>
                  <input
                    type="checkbox"
                    checked={form.isSittingMaster}
                    disabled={disableInputs}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        isSittingMaster: event.target.checked,
                      }))
                    }
                  />
                  <span className="muted">
                    Show master-only fields such as accompanying Brethren in visit logs.
                  </span>
                </label>
              </label>
            ) : null}

            <label className="stat">
              <span className="label">Lodge Name</span>
              <input
                className="card"
                style={{ padding: ".6rem" }}
                value={form.lodgeName}
                disabled={disableInputs}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    lodgeName: event.target.value,
                  }))
                }
                placeholder="e.g., Lodge Example"
              />
            </label>

            <label className="stat">
              <span className="label">Lodge Number</span>
              <input
                className="card"
                style={{ padding: ".6rem" }}
                value={form.lodgeNumber}
                disabled={disableInputs}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    lodgeNumber: event.target.value,
                  }))
                }
                placeholder="e.g., No. 123"
              />
            </label>

            <label className="stat">
              <span className="label">Region</span>
              <select
                className="card"
                style={{ padding: ".6rem" }}
                value={form.region}
                disabled={disableInputs}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    region: event.target.value,
                  }))
                }
              >
                <option value="">Select a region</option>
                {REGIONS.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </label>

            <label className="stat">
              <span className="label">Term start</span>
              <input
                type="date"
                className="card"
                style={{ padding: ".6rem" }}
                value={form.termStart}
                disabled={disableInputs}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    termStart: event.target.value,
                  }))
                }
              />
            </label>

            <label className="stat">
              <span className="label">Term end</span>
              <input
                type="date"
                className="card"
                style={{ padding: ".6rem" }}
                value={form.termEnd}
                disabled={disableInputs}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    termEnd: event.target.value,
                  }))
                }
              />
            </label>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="My lodges"
        description="Keep track of the lodges you belong to or have belonged to. These details power lodge selections elsewhere on this page."
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Lodge memberships</h3>
            <button
              type="button"
              className="btn-soft"
              disabled={disableInputs}
              onClick={addLodge}
            >
              Add lodge
            </button>
          </div>
          <div className="space-y-3">
            {form.lodges.length ? (
              form.lodges.map((lodge) => {
                const joinedSummary = lodge.joinDate ? `Joined ${lodge.joinDate}` : "";
                const resignedSummary = lodge.resignDate ? `Resigned ${lodge.resignDate}` : "";
                const lodgeSummary = [joinedSummary, resignedSummary].filter(Boolean).join(" • ");

                return (
                  <div key={lodge.id} className="card space-y-4 p-4">
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                      <label className="stat md:col-span-2">
                        <span className="label">Lodge name</span>
                        <input
                          className="card"
                          style={{ padding: ".6rem" }}
                          value={lodge.name}
                          disabled={disableInputs}
                          onChange={(event) =>
                            updateLodge(lodge.id, "name", event.target.value)
                          }
                          placeholder="e.g., Lodge Example"
                        />
                      </label>
                      <label className="stat">
                        <span className="label">Lodge number</span>
                        <input
                          className="card"
                          style={{ padding: ".6rem" }}
                          value={lodge.number}
                          disabled={disableInputs}
                          onChange={(event) =>
                            updateLodge(lodge.id, "number", event.target.value)
                          }
                          placeholder="e.g., No. 123"
                        />
                      </label>
                      <label className="stat">
                        <span className="label">Joined on</span>
                        <input
                          type="date"
                          className="card"
                          style={{ padding: ".6rem" }}
                          value={lodge.joinDate}
                          disabled={disableInputs}
                          onChange={(event) =>
                            updateLodge(lodge.id, "joinDate", event.target.value)
                          }
                        />
                      </label>
                      <label className="stat">
                        <span className="label">Resigned on</span>
                        <input
                          type="date"
                          className="card"
                          style={{ padding: ".6rem" }}
                          value={lodge.resignDate}
                          disabled={disableInputs}
                          onChange={(event) =>
                            updateLodge(lodge.id, "resignDate", event.target.value)
                          }
                        />
                      </label>
                    </div>
                    <div className="flex justify-between text-sm text-slate-600">
                      <p>
                        {lodgeSummary
                          ? lodgeSummary
                          : "Add the dates you joined and, if applicable, resigned for a complete record."}
                      </p>
                      <button
                        type="button"
                        className="text-sm text-red-600 hover:text-red-700"
                        disabled={disableInputs}
                        onClick={() => removeLodge(lodge.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-slate-500">
                No lodge memberships recorded yet. Add your lodges to unlock location selections for past offices.
              </p>
            )}
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Masonic journey"
        description="Record the dates you were initiated, passed, and raised to help with milestone planning."
      >
        <div className="grid gap-4 md:grid-cols-3">
            <label className="stat">
              <span className="label">Initiated on</span>
              <input
                type="date"
                className="card"
                style={{ padding: ".6rem" }}
                value={form.initiationDate}
                disabled={disableInputs}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    initiationDate: event.target.value,
                  }))
                }
              />
            </label>

            <label className="stat">
              <span className="label">Passed on</span>
              <input
                type="date"
                className="card"
                style={{ padding: ".6rem" }}
                value={form.passingDate}
                disabled={disableInputs}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    passingDate: event.target.value,
                  }))
                }
              />
            </label>

            <label className="stat">
              <span className="label">Raised on</span>
              <input
                type="date"
                className="card"
                style={{ padding: ".6rem" }}
                value={form.raisingDate}
                disabled={disableInputs}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    raisingDate: event.target.value,
                  }))
                }
              />
            </label>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Past offices"
        description="Capture the Craft Lodge and Grand Lodge offices you have held. Include years or ranges where helpful."
      >
        <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Craft Lodge offices</h3>
                <button
                  type="button"
                  className="btn-soft"
                  disabled={disableInputs}
                  onClick={() => addOffice("craftOffices")}
                >
                  Add office
                </button>
              </div>
              <div className="space-y-3">
                {form.craftOffices.length ? (
                  form.craftOffices.map((entry) => (
                    <div key={entry.id} className="card space-y-3 p-4">
                      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,160px)_minmax(0,220px)]">
                        <label className="stat sm:col-span-1">
                          <span className="label">Office</span>
                          <input
                            className="card"
                            style={{ padding: ".6rem" }}
                            value={entry.office}
                            disabled={disableInputs}
                            onChange={(event) =>
                              updateOffice("craftOffices", entry.id, "office", event.target.value)
                            }
                            placeholder="e.g., Senior Warden"
                          />
                        </label>
                        <label className="stat sm:col-span-1">
                          <span className="label">Years</span>
                          <input
                            className="card"
                            style={{ padding: ".6rem" }}
                            value={entry.years}
                            disabled={disableInputs}
                            onChange={(event) =>
                              updateOffice("craftOffices", entry.id, "years", event.target.value)
                            }
                            placeholder="e.g., 2021"
                          />
                        </label>
                        <label className="stat md:col-span-2 lg:col-span-1">
                          <span className="label">Lodge</span>
                          <select
                            className="card"
                            style={{ padding: ".6rem" }}
                            value={entry.lodgeId}
                            disabled={disableInputs || form.lodges.length === 0}
                            onChange={(event) =>
                              updateOffice("craftOffices", entry.id, "lodgeId", event.target.value)
                            }
                          >
                            <option value="">Select lodge</option>
                            {!form.lodges.some((lodge) => lodge.id === entry.lodgeId) && entry.lodgeId ? (
                              <option value={entry.lodgeId}>Previously selected lodge</option>
                            ) : null}
                            {form.lodges.map((lodge) => (
                              <option key={lodge.id} value={lodge.id}>
                                {lodge.name}
                                {lodge.number ? ` (No. ${lodge.number})` : ""}
                              </option>
                            ))}
                          </select>
                          {form.lodges.length === 0 ? (
                            <p className="mt-2 text-xs text-slate-500">
                              Add your lodges above to tag where this office was held.
                            </p>
                          ) : null}
                        </label>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          className="text-sm text-red-600 hover:text-red-700"
                          disabled={disableInputs}
                          onClick={() => removeOffice("craftOffices", entry.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No Craft Lodge offices recorded yet.</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Grand Lodge offices</h3>
                <button
                  type="button"
                  className="btn-soft"
                  disabled={disableInputs}
                  onClick={() => addOffice("grandOffices")}
                >
                  Add office
                </button>
              </div>
              <div className="space-y-3">
                {form.grandOffices.length ? (
                  form.grandOffices.map((entry) => (
                    <div key={entry.id} className="card space-y-3 p-4">
                      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,200px)_minmax(0,220px)]">
                        <label className="stat sm:col-span-1">
                          <span className="label">Office</span>
                          <input
                            className="card"
                            style={{ padding: ".6rem" }}
                            value={entry.office}
                            disabled={disableInputs}
                            onChange={(event) =>
                              updateOffice("grandOffices", entry.id, "office", event.target.value)
                            }
                            placeholder="e.g., Grand Steward"
                          />
                        </label>
                        <label className="stat sm:col-span-1">
                          <span className="label">Years</span>
                          <input
                            className="card"
                            style={{ padding: ".6rem" }}
                            value={entry.years}
                            disabled={disableInputs}
                            onChange={(event) =>
                              updateOffice("grandOffices", entry.id, "years", event.target.value)
                            }
                            placeholder="e.g., 2019-2020"
                          />
                        </label>
                        <label className="stat md:col-span-2 lg:col-span-1">
                          <span className="label">Lodge (optional)</span>
                          <select
                            className="card"
                            style={{ padding: ".6rem" }}
                            value={entry.lodgeId}
                            disabled={disableInputs || form.lodges.length === 0}
                            onChange={(event) =>
                              updateOffice("grandOffices", entry.id, "lodgeId", event.target.value)
                            }
                          >
                            <option value="">Select lodge</option>
                            {!form.lodges.some((lodge) => lodge.id === entry.lodgeId) && entry.lodgeId ? (
                              <option value={entry.lodgeId}>Previously selected lodge</option>
                            ) : null}
                            {form.lodges.map((lodge) => (
                              <option key={lodge.id} value={lodge.id}>
                                {lodge.name}
                                {lodge.number ? ` (No. ${lodge.number})` : ""}
                              </option>
                            ))}
                          </select>
                          {form.lodges.length === 0 ? (
                            <p className="mt-2 text-xs text-slate-500">
                              Add lodges above to link this Grand Lodge office to a specific lodge if desired.
                            </p>
                          ) : null}
                        </label>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          className="text-sm text-red-600 hover:text-red-700"
                          disabled={disableInputs}
                          onClick={() => removeOffice("grandOffices", entry.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No Grand Lodge offices recorded yet.</p>
                )}
              </div>
            </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Achievements"
        description="Mark the service milestones you have reached. Add the date when each badge or honour was presented."
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {ACHIEVEMENT_MILESTONES.map((milestone) => (
              <label key={milestone.key} className="stat">
                <span className="label">{milestone.label}</span>
                <input
                  type="date"
                  className="card"
                  style={{ padding: ".6rem" }}
                  value={form.achievementMilestones[milestone.key] ?? ""}
                  disabled={disableInputs}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      achievementMilestones: {
                        ...previous.achievementMilestones,
                        [milestone.key]: event.target.value,
                      },
                    }))
                  }
                />
              </label>
            ))}
        </div>
      </CollapsibleSection>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          className="btn"
          disabled={saving}
          onClick={handleCancel}
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn-primary"
          disabled={saving || loading}
          onClick={handleSave}
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
