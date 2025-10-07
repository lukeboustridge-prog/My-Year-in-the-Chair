import { z } from "zod";

export const WORK_TYPES = [
  "INITIATION",
  "PASSING",
  "RAISING",
  "INSTALLATION",
  "PRESENTATION",
  "LECTURE",
  "OTHER",
] as const;

export const visitSchema = z.object({
  date: z.string().min(1),
  lodgeName: z.string().optional(),
  lodgeNumber: z.string().optional(),
  region: z.string().optional(),
  workOfEvening: z.enum(WORK_TYPES).optional(),
  candidateName: z.string().optional(),
  grandLodgeVisit: z.boolean().optional(),
  comments: z.string().optional(),
  notes: z.string().optional(),
});

export function parseVisitDate(value: string) {
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    throw new Error("Invalid date");
  }
  return date;
}
