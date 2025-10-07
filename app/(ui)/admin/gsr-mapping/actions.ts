"use server";

import { revalidatePath } from "next/cache";
import {
  inferGsrMapping,
  loadGsrMapping,
  saveGsrMapping,
} from "@/lib/reports/gsrMapping";

export type LoadedGsrMapping = Awaited<ReturnType<typeof loadGsrMapping>>;

export async function updateGsrMappingAction(mapping: LoadedGsrMapping) {
  await saveGsrMapping(mapping);
  revalidatePath("/admin/gsr-mapping");
  return mapping;
}

export async function resetGsrMappingAction() {
  const mapping = inferGsrMapping();
  await saveGsrMapping(mapping);
  revalidatePath("/admin/gsr-mapping");
  return mapping;
}
