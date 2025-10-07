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

export const lodgeWorkSchema = z.object({
  meetingDate: z.string().optional(),
  month: z.number().min(1).max(12).optional(),
  year: z.number().min(2000).max(3000).optional(),
  work: z.enum(WORK_TYPES),
  candidateName: z.string().optional(),
  lecture: z.string().optional(),
  tracingBoard1: z.boolean().optional(),
  tracingBoard2: z.boolean().optional(),
  tracingBoard3: z.boolean().optional(),
  notes: z.string().optional(),
});

export function parseMeetingDate(value: string) {
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    throw new Error("Invalid meeting date");
  }
  return date;
}
