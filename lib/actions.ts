
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createVisit(formData: FormData) {
  const userId = (formData.get("userId") as string) || "";
  const date = new Date(formData.get("date") as string);
  const notes = (formData.get("notes") as string) || "";
  if (!userId) throw new Error("Missing userId");
  await prisma.visit.create({ data: { userId, date, notes } });
  revalidatePath("/visits");
}

export async function deleteVisit(id: string) {
  await prisma.visit.delete({ where: { id } });
  revalidatePath("/visits");
}

export async function createWorking(formData: FormData) {
  const userId = (formData.get("userId") as string) || "";
  const date = new Date(formData.get("date") as string);
  const working = (formData.get("working") as string) || "";
  const notes = (formData.get("notes") as string) || "";
  if (!userId || !working) throw new Error("Missing fields");
  await prisma.lodgeWorking.create({ data: { userId, date, working, notes } });
  revalidatePath("/workings");
}

export async function deleteWorking(id: string) {
  await prisma.lodgeWorking.delete({ where: { id } });
  revalidatePath("/workings");
}
