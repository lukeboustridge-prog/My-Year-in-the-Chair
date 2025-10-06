import { WorkType, type Visit } from '@prisma/client';

const WORK_TYPE_ALIASES: Record<string, WorkType> = {
  INITIATION: WorkType.INITIATION,
  EA: WorkType.INITIATION,
  'ENTERED APPRENTICE': WorkType.INITIATION,
  PASSING: WorkType.PASSING,
  FC: WorkType.PASSING,
  RAISING: WorkType.RAISING,
  MM: WorkType.RAISING,
  INSTALLATION: WorkType.INSTALLATION,
  PRESENTATION: WorkType.PRESENTATION,
  LECTURE: WorkType.LECTURE,
  OTHER: WorkType.OTHER,
};

const WORK_TYPE_LABELS: Record<WorkType, string> = {
  [WorkType.INITIATION]: 'Initiation',
  [WorkType.PASSING]: 'Passing',
  [WorkType.RAISING]: 'Raising',
  [WorkType.INSTALLATION]: 'Installation',
  [WorkType.PRESENTATION]: 'Presentation',
  [WorkType.LECTURE]: 'Lecture',
  [WorkType.OTHER]: 'Other',
};

export function parseDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
}

export function stringOrNull(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function normalizeWorkType(value: unknown, fallback?: WorkType | null): WorkType {
  if (typeof value === 'string') {
    const key = value.trim().toUpperCase();
    if (key && WORK_TYPE_ALIASES[key]) {
      return WORK_TYPE_ALIASES[key];
    }
  }
  return fallback ?? WorkType.OTHER;
}

export function formatWorkTypeLabel(value?: WorkType | null, fallback?: string | null): string {
  if (fallback && fallback.trim()) return fallback.trim();
  if (!value) return 'Other';
  return WORK_TYPE_LABELS[value] ?? 'Other';
}

export function deriveWork(body: any, existing?: WorkType | null) {
  const input = body?.workOfEvening ?? body?.eventType ?? body?.work;
  return normalizeWorkType(input, existing ?? WorkType.OTHER);
}

export function deriveEventLabel(body: any, work: WorkType) {
  const label = stringOrNull(body?.eventType);
  return label ?? formatWorkTypeLabel(work);
}

type VisitWithMeta = Visit & {
  createdAt?: Date | string;
  updatedAt?: Date | string;
  notes?: string | null;
};

export function serializeVisit(visit: VisitWithMeta) {
  const dateIso = visit.date instanceof Date ? visit.date.toISOString() : new Date(visit.date).toISOString();
  const createdAt = visit.createdAt instanceof Date ? visit.createdAt.toISOString() : visit.createdAt ?? null;
  const updatedAt = visit.updatedAt instanceof Date ? visit.updatedAt.toISOString() : visit.updatedAt ?? null;
  const eventType = stringOrNull(visit.eventType) || formatWorkTypeLabel(visit.workOfEvening);
  const notes = visit.notes ?? visit.comments ?? null;

  return {
    id: visit.id,
    userId: visit.userId,
    date: dateIso,
    dateISO: dateIso,
    lodgeName: visit.lodgeName ?? null,
    lodgeNumber: visit.lodgeNumber ?? null,
    region: visit.region ?? null,
    location: visit.location ?? null,
    workOfEvening: visit.workOfEvening,
    eventType,
    candidateName: visit.candidateName ?? null,
    comments: visit.comments ?? null,
    notes,
    grandLodgeVisit: Boolean(visit.grandLodgeVisit),
    createdAt,
    updatedAt,
  };
}
