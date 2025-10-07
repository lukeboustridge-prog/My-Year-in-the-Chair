"use client";

import { useMemo, useState, useTransition } from "react";
import type { GsrMapping } from "@/lib/reports/gsrMapping";
import { resetGsrMappingAction, updateGsrMappingAction } from "./actions";

type FieldMeta = {
  name: string;
  kind: string;
  type: string;
  isList: boolean;
  isRequired: boolean;
  isId: boolean;
  isUnique: boolean;
};

type ModelMeta = {
  name: string;
  fields: FieldMeta[];
};

type EnumMeta = {
  name: string;
  values: string[];
};

type Props = {
  initialMapping: GsrMapping;
  models: ModelMeta[];
  enums: EnumMeta[];
};

type Draft = GsrMapping;

type Section = "candidate" | "lodge" | "working" | "candidateWorking";

type FieldLookup = Record<string, ModelMeta>;

type Errors = string[];

function cloneMapping(mapping: GsrMapping): Draft {
  return JSON.parse(JSON.stringify(mapping));
}

function findModel(models: FieldLookup, name: string) {
  return models[name];
}

function pickIdField(model: ModelMeta | undefined) {
  return (
    model?.fields.find((field) => field.isId) ??
    model?.fields.find((field) => field.isUnique) ??
    model?.fields[0]
  );
}

function pickStringFields(model: ModelMeta | undefined) {
  return model?.fields.filter((field) => field.kind === "scalar" && field.type === "String") ?? [];
}

function ensureNameFields(draft: Draft, model: ModelMeta | undefined) {
  const stringFields = pickStringFields(model);
  if (draft.candidate.nameFields.some((name) => stringFields.some((field) => field.name === name))) {
    return;
  }
  draft.candidate.nameFields = stringFields
    .filter((field) => /(name|first|last|preferred|full)/i.test(field.name))
    .map((field) => field.name);
  if (draft.candidate.nameFields.length === 0 && stringFields.length > 0) {
    draft.candidate.nameFields = [stringFields[0].name];
  }
}

function ensureFieldPresent(section: Section, draft: Draft, model: ModelMeta | undefined) {
  if (!model) return;
  switch (section) {
    case "candidate": {
      const idField = pickIdField(model);
      if (!draft.candidate.id || !model.fields.some((field) => field.name === draft.candidate.id)) {
        draft.candidate.id = idField?.name ?? draft.candidate.id;
      }
      ensureNameFields(draft, model);
      if (
        draft.candidate.membershipNumber &&
        !model.fields.some((field) => field.name === draft.candidate.membershipNumber)
      ) {
        draft.candidate.membershipNumber = null;
      }
      break;
    }
    case "lodge": {
      const idField = pickIdField(model);
      if (!draft.lodge.id || !model.fields.some((field) => field.name === draft.lodge.id)) {
        draft.lodge.id = idField?.name ?? draft.lodge.id;
      }
      if (!model.fields.some((field) => field.name === draft.lodge.name)) {
        const stringFields = pickStringFields(model);
        draft.lodge.name = stringFields[0]?.name ?? draft.lodge.name;
      }
      if (
        draft.lodge.number &&
        !model.fields.some((field) => field.name === draft.lodge.number)
      ) {
        draft.lodge.number = null;
      }
      break;
    }
    case "working": {
      const idField = pickIdField(model);
      if (!draft.working.id || !model.fields.some((field) => field.name === draft.working.id)) {
        draft.working.id = idField?.name ?? draft.working.id;
      }
      if (!model.fields.some((field) => field.name === draft.working.date)) {
        const dateField = model.fields.find((field) => field.type === "DateTime");
        if (dateField) draft.working.date = dateField.name;
      }
      if (
        draft.working.type &&
        !model.fields.some((field) => field.name === draft.working.type)
      ) {
        draft.working.type = null;
      }
      if (!model.fields.some((field) => field.name === draft.working.lodgeRel)) {
        const relationField =
          model.fields.find((field) => field.kind === "object" && field.type === draft.lodge.model) ??
          model.fields.find((field) => field.kind === "object");
        if (relationField) draft.working.lodgeRel = relationField.name;
      }
      if (
        draft.working.notes &&
        !model.fields.some((field) => field.name === draft.working.notes)
      ) {
        draft.working.notes = null;
      }
      break;
    }
    case "candidateWorking": {
      const idField = pickIdField(model);
      if (!draft.candidateWorking.id || !model.fields.some((field) => field.name === draft.candidateWorking.id)) {
        draft.candidateWorking.id = idField?.name ?? draft.candidateWorking.id;
      }
      if (
        !model.fields.some((field) => field.name === draft.candidateWorking.candidateRel)
      ) {
        const candidateRel =
          model.fields.find((field) => field.kind === "object" && field.type === draft.candidate.model) ??
          model.fields.find((field) => field.kind === "object");
        if (candidateRel) draft.candidateWorking.candidateRel = candidateRel.name;
      }
      if (
        !model.fields.some((field) => field.name === draft.candidateWorking.workingRel)
      ) {
        const workingRel =
          model.fields.find((field) => field.kind === "object" && field.type === draft.working.model) ??
          model.fields.find((field) => field.kind === "object");
        if (workingRel) draft.candidateWorking.workingRel = workingRel.name;
      }
      if (
        !model.fields.some((field) => field.name === draft.candidateWorking.ceremony)
      ) {
        const stringFields = pickStringFields(model);
        draft.candidateWorking.ceremony =
          stringFields.find((field) => /(ceremony|degree|working)/i.test(field.name))?.name ??
          stringFields[0]?.name ??
          draft.candidateWorking.ceremony;
      }
      if (
        draft.candidateWorking.result &&
        !model.fields.some((field) => field.name === draft.candidateWorking.result)
      ) {
        draft.candidateWorking.result = null;
      }
      if (
        draft.candidateWorking.remarks &&
        !model.fields.some((field) => field.name === draft.candidateWorking.remarks)
      ) {
        draft.candidateWorking.remarks = null;
      }
      break;
    }
    default:
      break;
  }
}

function validateDraft(draft: Draft, models: FieldLookup): Errors {
  const errors: Errors = [];
  const candidateModel = findModel(models, draft.candidate.model);
  const lodgeModel = findModel(models, draft.lodge.model);
  const workingModel = findModel(models, draft.working.model);
  const joinModel = findModel(models, draft.candidateWorking.model);

  if (!candidateModel) errors.push("Candidate model is missing");
  if (!lodgeModel) errors.push("Lodge model is missing");
  if (!workingModel) errors.push("Working model is missing");
  if (!joinModel) errors.push("Candidate/Working join model is missing");
  if (draft.candidate.nameFields.length === 0) errors.push("At least one candidate name field is required");
  return errors;
}

export default function MappingForm({ initialMapping, models, enums }: Props) {
  const modelLookup = useMemo<FieldLookup>(
    () => Object.fromEntries(models.map((model) => [model.name, model])),
    [models]
  );
  const [draft, setDraft] = useState<Draft>(() => cloneMapping(initialMapping));
  const [status, setStatus] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>([]);
  const [isPending, startTransition] = useTransition();

  const candidateModel = findModel(modelLookup, draft.candidate.model);
  const lodgeModel = findModel(modelLookup, draft.lodge.model);
  const workingModel = findModel(modelLookup, draft.working.model);
  const joinModel = findModel(modelLookup, draft.candidateWorking.model);

  const candidateStringFields = pickStringFields(candidateModel);
  const lodgeStringFields = pickStringFields(lodgeModel);
  const workingFields = workingModel?.fields ?? [];
  const joinFields = joinModel?.fields ?? [];

  const ceremonyEnumOptions = enums;

  const updateSectionModel = (section: Section, modelName: string) => {
    setDraft((prev) => {
      const next = cloneMapping(prev);
      (next as any)[section].model = modelName;
      ensureFieldPresent(section, next, modelLookup[modelName]);
      return next;
    });
  };

  const handleNameFieldToggle = (field: string) => {
    setDraft((prev) => {
      const next = cloneMapping(prev);
      const set = new Set(next.candidate.nameFields);
      if (set.has(field)) {
        set.delete(field);
      } else {
        set.add(field);
      }
      next.candidate.nameFields = Array.from(set);
      return next;
    });
  };

  const handleFieldChange = (section: Section, key: string, value: string | null) => {
    setDraft((prev) => {
      const next = cloneMapping(prev);
      if (value === "") {
        (next as any)[section][key] = null;
      } else {
        (next as any)[section][key] = value;
      }
      return next;
    });
  };

  const handleSave = () => {
    const validation = validateDraft(draft, modelLookup);
    if (validation.length > 0) {
      setErrors(validation);
      setStatus(null);
      return;
    }
    setErrors([]);
    startTransition(async () => {
      try {
        await updateGsrMappingAction(draft);
        setStatus("Mapping updated successfully.");
      } catch (error: any) {
        console.error("GSR_MAPPING_SAVE", error);
        setStatus(error?.message ?? "Failed to save mapping");
      }
    });
  };

  const handleReset = () => {
    startTransition(async () => {
      try {
        const mapping = await resetGsrMappingAction();
        setDraft(cloneMapping(mapping));
        setStatus("Mapping reset from schema.");
        setErrors([]);
      } catch (error: any) {
        console.error("GSR_MAPPING_RESET", error);
        setStatus(error?.message ?? "Failed to reset mapping");
      }
    });
  };

  return (
    <div className="space-y-8 rounded-lg border border-gray-200 bg-white p-6 shadow">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Auto-discovered mapping</h2>
          <p className="text-sm text-gray-600">
            Adjust these selections if the automated schema inference picked the wrong models or fields.
          </p>
        </div>
        <button
          type="button"
          onClick={handleReset}
          disabled={isPending}
          className="rounded border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Reset from schema
        </button>
      </div>
      {errors.length > 0 && (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">Please fix the following before saving:</p>
          <ul className="list-disc pl-5">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      {status && <div className="rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">{status}</div>}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Candidate</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex flex-col text-sm font-medium text-gray-700">
            Model
            <select
              className="mt-1 rounded border border-gray-300 px-3 py-2"
              value={draft.candidate.model}
              onChange={(event) => updateSectionModel("candidate", event.target.value)}
            >
              {models.map((model) => (
                <option key={model.name} value={model.name}>
                  {model.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-sm font-medium text-gray-700">
            Identifier field
            <select
              className="mt-1 rounded border border-gray-300 px-3 py-2"
              value={draft.candidate.id}
              onChange={(event) => handleFieldChange("candidate", "id", event.target.value)}
            >
              {(candidateModel?.fields ?? []).map((field) => (
                <option key={field.name} value={field.name}>
                  {field.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="space-y-1">
          <span className="text-sm font-medium text-gray-700">Name fields</span>
          <div className="flex flex-wrap gap-3">
            {candidateStringFields.map((field) => (
              <label key={field.name} className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={draft.candidate.nameFields.includes(field.name)}
                  onChange={() => handleNameFieldToggle(field.name)}
                />
                {field.name}
              </label>
            ))}
            {candidateStringFields.length === 0 && (
              <p className="text-sm text-gray-500">No string fields found on this model.</p>
            )}
          </div>
        </div>
        <label className="flex w-full flex-col text-sm font-medium text-gray-700 md:w-1/2">
          Membership number field
          <select
            className="mt-1 rounded border border-gray-300 px-3 py-2"
            value={draft.candidate.membershipNumber ?? ""}
            onChange={(event) => handleFieldChange("candidate", "membershipNumber", event.target.value)}
          >
            <option value="">(none)</option>
            {candidateStringFields.map((field) => (
              <option key={field.name} value={field.name}>
                {field.name}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Lodge</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex flex-col text-sm font-medium text-gray-700">
            Model
            <select
              className="mt-1 rounded border border-gray-300 px-3 py-2"
              value={draft.lodge.model}
              onChange={(event) => updateSectionModel("lodge", event.target.value)}
            >
              {models.map((model) => (
                <option key={model.name} value={model.name}>
                  {model.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-sm font-medium text-gray-700">
            Identifier field
            <select
              className="mt-1 rounded border border-gray-300 px-3 py-2"
              value={draft.lodge.id}
              onChange={(event) => handleFieldChange("lodge", "id", event.target.value)}
            >
              {(lodgeModel?.fields ?? []).map((field) => (
                <option key={field.name} value={field.name}>
                  {field.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex flex-col text-sm font-medium text-gray-700">
            Name field
            <select
              className="mt-1 rounded border border-gray-300 px-3 py-2"
              value={draft.lodge.name}
              onChange={(event) => handleFieldChange("lodge", "name", event.target.value)}
            >
              {lodgeStringFields.map((field) => (
                <option key={field.name} value={field.name}>
                  {field.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-sm font-medium text-gray-700">
            Number field
            <select
              className="mt-1 rounded border border-gray-300 px-3 py-2"
              value={draft.lodge.number ?? ""}
              onChange={(event) => handleFieldChange("lodge", "number", event.target.value)}
            >
              <option value="">(none)</option>
              {(lodgeModel?.fields ?? []).map((field) => (
                <option key={field.name} value={field.name}>
                  {field.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Working</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex flex-col text-sm font-medium text-gray-700">
            Model
            <select
              className="mt-1 rounded border border-gray-300 px-3 py-2"
              value={draft.working.model}
              onChange={(event) => updateSectionModel("working", event.target.value)}
            >
              {models.map((model) => (
                <option key={model.name} value={model.name}>
                  {model.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-sm font-medium text-gray-700">
            Identifier field
            <select
              className="mt-1 rounded border border-gray-300 px-3 py-2"
              value={draft.working.id}
              onChange={(event) => handleFieldChange("working", "id", event.target.value)}
            >
              {workingFields.map((field) => (
                <option key={field.name} value={field.name}>
                  {field.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="flex flex-col text-sm font-medium text-gray-700">
            Date field
            <select
              className="mt-1 rounded border border-gray-300 px-3 py-2"
              value={draft.working.date}
              onChange={(event) => handleFieldChange("working", "date", event.target.value)}
            >
              {workingFields
                .filter((field) => field.type === "DateTime")
                .map((field) => (
                  <option key={field.name} value={field.name}>
                    {field.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="flex flex-col text-sm font-medium text-gray-700">
            Type field
            <select
              className="mt-1 rounded border border-gray-300 px-3 py-2"
              value={draft.working.type ?? ""}
              onChange={(event) => handleFieldChange("working", "type", event.target.value)}
            >
              <option value="">(none)</option>
              {workingFields.map((field) => (
                <option key={field.name} value={field.name}>
                  {field.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-sm font-medium text-gray-700">
            Lodge relation
            <select
              className="mt-1 rounded border border-gray-300 px-3 py-2"
              value={draft.working.lodgeRel}
              onChange={(event) => handleFieldChange("working", "lodgeRel", event.target.value)}
            >
              {workingFields
                .filter((field) => field.kind === "object")
                .map((field) => (
                  <option key={field.name} value={field.name}>
                    {field.name}
                  </option>
                ))}
            </select>
          </label>
        </div>
        <label className="flex w-full flex-col text-sm font-medium text-gray-700 md:w-1/3">
          Notes field
          <select
            className="mt-1 rounded border border-gray-300 px-3 py-2"
            value={draft.working.notes ?? ""}
            onChange={(event) => handleFieldChange("working", "notes", event.target.value)}
          >
            <option value="">(none)</option>
            {workingFields
              .filter((field) => field.type === "String")
              .map((field) => (
                <option key={field.name} value={field.name}>
                  {field.name}
                </option>
              ))}
          </select>
        </label>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Candidate ↔ Working</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex flex-col text-sm font-medium text-gray-700">
            Join model
            <select
              className="mt-1 rounded border border-gray-300 px-3 py-2"
              value={draft.candidateWorking.model}
              onChange={(event) => updateSectionModel("candidateWorking", event.target.value)}
            >
              {models.map((model) => (
                <option key={model.name} value={model.name}>
                  {model.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-sm font-medium text-gray-700">
            Identifier field
            <select
              className="mt-1 rounded border border-gray-300 px-3 py-2"
              value={draft.candidateWorking.id}
              onChange={(event) => handleFieldChange("candidateWorking", "id", event.target.value)}
            >
              {joinFields.map((field) => (
                <option key={field.name} value={field.name}>
                  {field.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="flex flex-col text-sm font-medium text-gray-700">
            Candidate relation
            <select
              className="mt-1 rounded border border-gray-300 px-3 py-2"
              value={draft.candidateWorking.candidateRel}
              onChange={(event) => handleFieldChange("candidateWorking", "candidateRel", event.target.value)}
            >
              {joinFields
                .filter((field) => field.kind === "object")
                .map((field) => (
                  <option key={field.name} value={field.name}>
                    {field.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="flex flex-col text-sm font-medium text-gray-700">
            Working relation
            <select
              className="mt-1 rounded border border-gray-300 px-3 py-2"
              value={draft.candidateWorking.workingRel}
              onChange={(event) => handleFieldChange("candidateWorking", "workingRel", event.target.value)}
            >
              {joinFields
                .filter((field) => field.kind === "object")
                .map((field) => (
                  <option key={field.name} value={field.name}>
                    {field.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="flex flex-col text-sm font-medium text-gray-700">
            Ceremony field
            <select
              className="mt-1 rounded border border-gray-300 px-3 py-2"
              value={draft.candidateWorking.ceremony}
              onChange={(event) => handleFieldChange("candidateWorking", "ceremony", event.target.value)}
            >
              {joinFields.map((field) => (
                <option key={field.name} value={field.name}>
                  {field.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="flex flex-col text-sm font-medium text-gray-700">
            Result field
            <select
              className="mt-1 rounded border border-gray-300 px-3 py-2"
              value={draft.candidateWorking.result ?? ""}
              onChange={(event) => handleFieldChange("candidateWorking", "result", event.target.value)}
            >
              <option value="">(none)</option>
              {joinFields.map((field) => (
                <option key={field.name} value={field.name}>
                  {field.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-sm font-medium text-gray-700">
            Remarks field
            <select
              className="mt-1 rounded border border-gray-300 px-3 py-2"
              value={draft.candidateWorking.remarks ?? ""}
              onChange={(event) => handleFieldChange("candidateWorking", "remarks", event.target.value)}
            >
              <option value="">(none)</option>
              {joinFields
                .filter((field) => field.type === "String")
                .map((field) => (
                  <option key={field.name} value={field.name}>
                    {field.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="flex flex-col text-sm font-medium text-gray-700">
            Ceremony enum
            <select
              className="mt-1 rounded border border-gray-300 px-3 py-2"
              value={draft.ceremonyEnum?.name ?? ""}
              onChange={(event) => {
                const value = event.target.value;
                setDraft((prev) => {
                  const next = cloneMapping(prev);
                  if (!value) {
                    delete (next as any).ceremonyEnum;
                  } else {
                    next.ceremonyEnum = enums.find((item) => item.name === value);
                  }
                  return next;
                });
              }}
            >
              <option value="">(none)</option>
              {ceremonyEnumOptions.map((item) => (
                <option key={item.name} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="flex w-full flex-col text-sm font-medium text-gray-700 md:w-1/3">
          Result enum
          <select
            className="mt-1 rounded border border-gray-300 px-3 py-2"
            value={draft.resultEnum?.name ?? ""}
            onChange={(event) => {
              const value = event.target.value;
              setDraft((prev) => {
                const next = cloneMapping(prev);
                if (!value) {
                  delete (next as any).resultEnum;
                } else {
                  next.resultEnum = enums.find((item) => item.name === value);
                }
                return next;
              });
            }}
          >
            <option value="">(none)</option>
            {enums.map((item) => (
              <option key={item.name} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      </section>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">Changes are saved to <code>config/gsr-mapping.json</code>.</p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
        >
          {isPending ? "Saving…" : "Save mapping"}
        </button>
      </div>
    </div>
  );
}
