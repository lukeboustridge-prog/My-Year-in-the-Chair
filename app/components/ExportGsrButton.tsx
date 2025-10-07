import { loadGsrMapping } from "@/lib/reports/gsrMapping";
import { db } from "@/lib/db";
import { Suspense } from "react";
import ExportGsrButtonClient, { type LodgeOption } from "./ExportGsrButtonClient";

async function getLodgeOptions() {
  const mapping = await loadGsrMapping();
  const delegate = (db as any)[mapping.lodge.model];
  if (!delegate?.findMany) {
    return [] as LodgeOption[];
  }
  const records: any[] = await delegate.findMany({
    orderBy: { [mapping.lodge.name]: "asc" },
  });
  const lodges = records.map((record) => {
    const idValue = record?.[mapping.lodge.id];
    const nameValue = record?.[mapping.lodge.name];
    const numberValue = mapping.lodge.number ? record?.[mapping.lodge.number] : null;
    const labelBase = [nameValue, numberValue ? `No. ${numberValue}` : null]
      .filter(Boolean)
      .join(" ");
    return {
      id: String(idValue ?? ""),
      label: labelBase || String(idValue ?? "Unnamed"),
    };
  });
  return lodges;
}

function Loading() {
  return <div className="rounded-md border border-dashed border-gray-300 p-4 text-sm text-gray-500">Loading export tools…</div>;
}

export default async function ExportGsrButton() {
  const lodges = await getLodgeOptions();
  return (
    <Suspense fallback={<Loading />}>
      <ExportGsrButtonClient lodges={lodges} />
    </Suspense>
  );
}
