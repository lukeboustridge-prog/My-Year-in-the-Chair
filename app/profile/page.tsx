"use client";

import { useEffect, useMemo, useState } from "react";
import { RANK_OPTIONS, RANK_META, deriveTitle } from "@/lib/constants";

type ProfileForm = {
  name: string;
  rank: string;
  isPastGrand: boolean;
  lodgeName: string;
  lodgeNumber: string;
  region: string;
  termStart: string;
  termEnd: string;
};

const DEFAULT_FORM: ProfileForm = {
  name: "",
  rank: "Master Mason",
  isPastGrand: false,
  lodgeName: "",
  lodgeNumber: "",
  region: "",
  termStart: "",
  termEnd: "",
};

export default function ProfilePage() {
  const [form, setForm] = useState<ProfileForm>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) return;
        const data = await res.json();
        setForm({
          name: data.name ?? "",
          rank: data.rank ?? "Master Mason",
          isPastGrand: data.isPastGrand ?? false,
          lodgeName: data.lodgeName ?? "",
          lodgeNumber: data.lodgeNumber ?? "",
          region: data.region ?? "",
          termStart: data.termStart ? data.termStart.slice(0, 10) : "",
          termEnd: data.termEnd ? data.termEnd.slice(0, 10) : "",
        });
      } catch (error) {
        console.error("Failed to load profile", error);
      }
    })();
  }, []);

  const derivedTitles = useMemo(
    () => deriveTitle(form.rank, form.isPastGrand),
    [form.rank, form.isPastGrand],
  );

  const grandRanks = useMemo(
    () => RANK_OPTIONS.filter((rank) => RANK_META[rank]?.grand),
    []
  );
  const rankChoices = form.isPastGrand ? grandRanks : RANK_OPTIONS;

  useEffect(() => {
    const options = form.isPastGrand ? grandRanks : RANK_OPTIONS;
    if (!options.includes(form.rank)) {
      setForm((prev) => ({ ...prev, rank: options[0] ?? prev.rank }));
    }
  }, [form.isPastGrand, form.rank, grandRanks]);

  const close = () => {
    if (typeof window === "undefined") return;
    if (window.history.length > 1) window.history.back();
    else window.location.href = "/dashboard";
  };

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          prefix: derivedTitles.prefix,
          postNominals: derivedTitles.postNominals,
        }),
      });
      if (!res.ok) alert("Failed to save profile");
    } catch (error) {
      console.error("Failed to save profile", error);
      alert("Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/70"
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div className="card max-h-[90vh] w-full max-w-lg overflow-hidden sm:max-w-xl md:max-w-2xl">
          <div className="card-body space-y-6 overflow-y-auto p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="h2">Edit profile</h1>
                <p className="text-sm text-slate-500">
                  Update your personal and lodge details.
                </p>
              </div>
              <button type="button" className="btn" onClick={close}>
                Close
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="stat md:col-span-2">
                <span className="label">Name</span>
                <input
                  className="card"
                  style={{ padding: ".6rem" }}
                  value={form.name}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, name: event.target.value }))
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
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, isPastGrand: event.target.checked }))
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
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, rank: event.target.value }))
                  }
                >
                  {rankChoices.map((rank) => (
                    <option key={rank} value={rank}>
                      {form.isPastGrand && RANK_META[rank]?.grand
                        ? `Past ${rank}`
                        : rank}
                    </option>
                  ))}
                </select>
              </label>

              <label className="stat">
                <span className="label">Lodge Name</span>
                <input
                  className="card"
                  style={{ padding: ".6rem" }}
                  value={form.lodgeName}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, lodgeName: event.target.value }))
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
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, lodgeNumber: event.target.value }))
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
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, region: event.target.value }))
                  }
                >
                  <option value="">Select a region</option>
                  {Array.from({ length: 9 }).map((_, index) => {
                    const region = `Region ${index + 1}`;
                    return (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    );
                  })}
                </select>
              </label>

              <label className="stat">
                <span className="label">Term start</span>
                <input
                  type="date"
                  className="card"
                  style={{ padding: ".6rem" }}
                  value={form.termStart}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, termStart: event.target.value }))
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
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, termEnd: event.target.value }))
                  }
                />
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50 p-4 sm:flex-row sm:justify-end">
            <button type="button" className="btn" onClick={close}>
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="btn-primary"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
