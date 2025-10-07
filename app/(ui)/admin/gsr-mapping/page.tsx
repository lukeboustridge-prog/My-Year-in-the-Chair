import MappingForm from "./MappingForm";
import { availableEnums, availableModels, loadGsrMapping } from "@/lib/reports/gsrMapping";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = getSession();
  if (!session) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-8">
        <h1 className="text-2xl font-semibold">GSR Mapping</h1>
        <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          You must be signed in to adjust the Grand Superintendent report mapping.
        </p>
      </div>
    );
  }

  const [mapping, models, enums] = await Promise.all([
    loadGsrMapping(),
    Promise.resolve(availableModels()),
    Promise.resolve(availableEnums()),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold">Grand Superintendent Mapping</h1>
        <p className="mt-2 text-sm text-gray-600">
          Review the auto-discovered Prisma mapping and adjust any field names that differ in your schema.
        </p>
      </div>
      <MappingForm initialMapping={mapping} models={models} enums={enums} />
    </div>
  );
}
