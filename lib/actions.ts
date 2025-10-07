"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function parseDate(value: FormDataEntryValue | null) {
  if (!value) return null;
  const date = new Date(value as string);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export async function createVisit(formData: FormData) {
  const userId = (formData.get("userId") as string) || "";
  const date = parseDate(formData.get("date"));
  const notes = (formData.get("notes") as string) || "";
  const lodgeId = (formData.get("lodgeId") as string) || undefined;

  if (!userId) throw new Error("Missing userId");
  if (!date) throw new Error("Please provide a valid date for the visit.");

  await prisma.visit.create({ data: { userId, date, notes, lodgeId } });
  revalidatePath("/visits");
}

export async function deleteVisit(id: string) {
  await prisma.visit.delete({ where: { id } });
  revalidatePath("/visits");
}

export async function createWorking(formData: FormData) {
  const userId = (formData.get("userId") as string) || "";
  const date = parseDate(formData.get("date"));
  const working = (formData.get("working") as string) || "";
  const notes = (formData.get("notes") as string) || "";
  const lodgeId = (formData.get("lodgeId") as string) || undefined;

  if (!userId || !working) throw new Error("Missing required fields");
  if (!date) throw new Error("Please provide a valid date for the working.");

  await prisma.lodgeWorking.create({ data: { userId, date, working, notes, lodgeId } });
  revalidatePath("/workings");
}

export async function deleteWorking(id: string) {
  await prisma.lodgeWorking.delete({ where: { id } });
  revalidatePath("/workings");
}
