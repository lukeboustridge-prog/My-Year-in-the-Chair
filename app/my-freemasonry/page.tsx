"use client";

import { useEffect, useMemo, useState } from "react";

import { RANK_META, RANK_OPTIONS, deriveTitle, type Rank } from "@/lib/constants";
import { REGIONS } from "@/lib/regions";
import {
  ACHIEVEMENT_MILESTONES,
  createEmptyMilestones,
  type AchievementMilestoneRecord,
  type OfficeRecord,
} from "@/lib/myFreemasonry";

const MILESTONE_KEYS = ACHIEVEMENT_MILESTONES.map((milestone) => milestone.key);

const randomId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10);

type OfficeRow = OfficeRecord & { id: string };

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
  craftOffices: OfficeRow[];
  grandOffices: OfficeRow[];
  achievementMilestones: Record<string, string>;
};

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
  craftOffices: [],
  grandOffices: [],
  achievementMilestones: MILESTONE_KEYS.reduce<Record<string, string>>((acc, key) => {
    acc[key] = "";
    return acc;
  }, {}),
});

const createOfficeRow = (initial?: Partial<OfficeRecord>): OfficeRow => ({
  id: randomId(),
  office: initial?.office ?? "",
  years: initial?.years ?? "",
});

const normaliseOffices = (value: unknown): OfficeRow[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const officeRaw = (entry as { office?: unknown }).office;
      const yearsRaw = (entry as { years?: unknown }).years;
      const office = typeof officeRaw === "string" ? officeRaw : "";
      const years = typeof yearsRaw === "string" ? yearsRaw : "";
      if (!office && !years) return null;
      return createOfficeRow({ office, years });
    })
    .filter((entry): entry is OfficeRow => Boolean(entry));
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

  const updateOffice = (key: "craftOffices" | "grandOffices", id: string, field: "office" | "years", value: string) => {
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

    const sanitiseOffices = (rows: OfficeRow[]): OfficeRecord[] =>
      rows
        .map((row) => ({
          office: row.office.trim(),
          years: row.years?.trim() ?? "",
        }))
        .filter((row) => row.office || row.years)
        .map((row) => (row.years ? row : { office: row.office }));

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
          ...form,
          prefix: derivedTitles.prefix,
          postNominals: derivedTitles.postNominals,
          craftOffices,
          grandOffices,
          achievementMilestones,
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

      <section className="card">
        <div className="card-body space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-slate-900">Profile basics</h2>
            <p className="text-sm text-slate-600">
              Update the core information that appears on leaderboards, reports, and approvals.
            </p>
          </div>

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
        </div>
      </section>

      <section className="card">
        <div className="card-body space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-slate-900">Masonic journey</h2>
            <p className="text-sm text-slate-600">
              Record the dates you were initiated, passed, and raised to help with milestone planning.
            </p>
          </div>

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
        </div>
      </section>

      <section className="card">
        <div className="card-body space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-slate-900">Past offices</h2>
            <p className="text-sm text-slate-600">
              Capture the Craft Lodge and Grand Lodge offices you have held. Include years or ranges where helpful.
            </p>
          </div>

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
                      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,140px)]">
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
                            value={entry.years ?? ""}
                            disabled={disableInputs}
                            onChange={(event) =>
                              updateOffice("craftOffices", entry.id, "years", event.target.value)
                            }
                            placeholder="e.g., 2021"
                          />
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
                      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,140px)]">
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
                            value={entry.years ?? ""}
                            disabled={disableInputs}
                            onChange={(event) =>
                              updateOffice("grandOffices", entry.id, "years", event.target.value)
                            }
                            placeholder="e.g., 2019-2020"
                          />
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
        </div>
      </section>

      <section className="card">
        <div className="card-body space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-slate-900">Achievements</h2>
            <p className="text-sm text-slate-600">
              Mark the service milestones you have reached. Add the date when each badge or honour was presented.
            </p>
          </div>

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
        </div>
      </section>

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
