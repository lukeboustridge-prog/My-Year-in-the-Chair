import { redirect } from "next/navigation";
import type { WorkType } from "@prisma/client";

import { getUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { REGIONS } from "@/lib/regions";

import { EventRegionSelect } from "./EventRegionSelect";
import { EventRSVPButton } from "./EventRSVPButton";

const WORK_LABELS: Record<WorkType, string> = {
  INITIATION: "First Degree",
  PASSING: "Second Degree",
  RAISING: "Third Degree",
  INSTALLATION: "Installation",
  PRESENTATION: "Presentation",
  LECTURE: "Lecture",
  OTHER: "Other",
};

type SearchParams = {
  region?: string | string[];
};

function formatEventDate(year: number, month: number) {
  return new Date(year, month - 1).toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });
}

const ALL_VALUE = "all";

function resolveRegionValue(value: string | undefined, viewerRegion: string | null, validRegions: Set<string>) {
  if (!value) return viewerRegion ?? ALL_VALUE;
  if (value === ALL_VALUE) return ALL_VALUE;
  return validRegions.has(value) ? value : viewerRegion ?? ALL_VALUE;
}

export default async function EventsPage({ searchParams }: { searchParams?: SearchParams }) {
  const userId = getUserId();
  if (!userId) return redirect("/login?redirect=/events");

  const viewer = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, region: true },
  });
  if (!viewer) return redirect("/login");

  const viewerRegion = viewer.region ?? null;
  const validRegions = new Set<string>([ALL_VALUE, ...REGIONS]);
  if (viewerRegion) validRegions.add(viewerRegion);

  const regionParamRaw = searchParams?.region;
  const regionParam = Array.isArray(regionParamRaw) ? regionParamRaw[0] : regionParamRaw;
  const selectedRegion = resolveRegionValue(regionParam, viewerRegion, validRegions);
  const regionFilter = selectedRegion === ALL_VALUE ? undefined : selectedRegion;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const eventsRaw = await db.lodgeWork.findMany({
    where: {
      displayOnEventsPage: true,
      user: {
        isApproved: true,
        ...(regionFilter ? { region: regionFilter } : {}),
      },
      AND: [
        {
          OR: [
            { year: { gt: currentYear } },
            { year: currentYear, month: { gte: currentMonth } },
          ],
        },
      ],
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          lodgeName: true,
          lodgeNumber: true,
          region: true,
        },
      },
      rsvps: {
        where: { userId },
        select: { id: true },
      },
      _count: {
        select: { rsvps: true },
      },
    },
    orderBy: [
      { year: "asc" },
      { month: "asc" },
      { createdAt: "asc" },
    ],
  });

  const events = eventsRaw.map(({ _count, rsvps, ...event }) => ({
    ...event,
    rsvpCount: _count.rsvps,
    alreadyRsvped: rsvps.length > 0,
  }));

  const regionOptions: { value: string; label: string }[] = [];
  const optionSeen = new Set<string>();
  if (viewerRegion) {
    regionOptions.push({ value: viewerRegion, label: `${viewerRegion} (My region)` });
    optionSeen.add(viewerRegion);
  }
  regionOptions.push({ value: ALL_VALUE, label: "All regions" });
  optionSeen.add(ALL_VALUE);
  for (const region of REGIONS) {
    if (!optionSeen.has(region)) {
      regionOptions.push({ value: region, label: region });
      optionSeen.add(region);
    }
  }

  if (!optionSeen.has(selectedRegion)) {
    regionOptions.push({ value: selectedRegion, label: selectedRegion });
  }

  const regionDescription =
    selectedRegion === ALL_VALUE
      ? "All regions"
      : selectedRegion === viewerRegion
      ? `${selectedRegion} (My region)`
      : selectedRegion;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="h1">Upcoming Events</h1>
          <p className="subtle">Explore lodge workings that are open for visitors.</p>
          <p className="text-xs text-slate-500">Currently viewing: {regionDescription}</p>
        </div>
        <EventRegionSelect options={regionOptions} value={selectedRegion} />
      </div>

      <div className="grid gap-4">
        {events.length === 0 ? (
          <div className="card">
            <div className="card-body">
              <p className="text-sm text-slate-500">
                There are no upcoming lodge workings for this selection yet.
              </p>
            </div>
          </div>
        ) : (
          events.map((event) => {
            const hostLodgeLabel = [event.user.lodgeName, event.user.lodgeNumber]
              .filter(Boolean)
              .join(" · ");
            const tags: string[] = [];
            if (event.isGrandLodgeVisit) tags.push("Grand Lodge visit");
            if (event.isEmergencyMeeting) tags.push("Emergency meeting");
            if (event.hasFirstTracingBoard) tags.push("1st tracing board");
            if (event.hasSecondTracingBoard) tags.push("2nd tracing board");
            if (event.hasThirdTracingBoard) tags.push("3rd tracing board");

            return (
              <div key={event.id} className="card">
                <div className="card-body gap-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        {WORK_LABELS[event.work] ?? event.work.replace(/_/g, " ")}
                      </h2>
                      <p className="text-sm text-slate-500">
                        {formatEventDate(event.year, event.month)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        RSVPs: {event.rsvpCount}
                      </span>
                      <EventRSVPButton
                        lodgeWorkId={event.id}
                        alreadyRsvped={event.alreadyRsvped}
                        disabled={event.userId === userId}
                      />
                    </div>
                  </div>

                  <div className="text-sm text-slate-600">
                    <p>
                      Hosted by <span className="font-medium">{event.user.name ?? "Unknown"}</span>
                      {hostLodgeLabel ? ` · ${hostLodgeLabel}` : ""}
                    </p>
                    <p className="text-xs text-slate-500">
                      Region: {event.user.region ?? "Unspecified"}
                    </p>
                    {event.candidateName ? (
                      <p className="mt-2">
                        Candidate: <span className="font-medium">{event.candidateName}</span>
                      </p>
                    ) : null}
                    {event.notes ? (
                      <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{event.notes}</p>
                    ) : null}
                  </div>

                  {tags.length ? (
                    <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                      {tags.map((tag) => (
                        <span key={tag} className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1">
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {event.userId === userId ? (
                    <p className="text-xs font-medium text-emerald-600">This is one of your lodge workings.</p>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
