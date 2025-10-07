import { Prisma } from "@prisma/client";
import { promises as fs } from "fs";
import path from "path";

type Model = ReturnType<typeof getModels>[number];
type FieldMeta = Model["fields"][number];

export type GsrMapping = {
  candidate: {
    model: string;
    id: string;
    nameFields: string[];
    membershipNumber?: string | null;
  };
  lodge: {
    model: string;
    id: string;
    name: string;
    number?: string | null;
  };
  working: {
    model: string;
    id: string;
    date: string;
    type?: string | null;
    lodgeRel: string;
    notes?: string | null;
  };
  candidateWorking: {
    model: string;
    id: string;
    candidateRel: string;
    workingRel: string;
    ceremony: string;
    result?: string | null;
    remarks?: string | null;
  };
  ceremonyEnum?: {
    name: string;
    values: string[];
  };
  resultEnum?: {
    name: string;
    values: string[];
  };
};

const MAPPING_PATH = path.join(process.cwd(), "config", "gsr-mapping.json");
type Datamodel = typeof Prisma.dmmf extends { datamodel: infer D } ? D : never;

let datamodelCache: Datamodel | null = null;

function getDatamodel(): Datamodel {
  if (datamodelCache) return datamodelCache;
  const dmmf = (Prisma as any)?.dmmf as { datamodel: Datamodel } | undefined;
  if (!dmmf?.datamodel) {
    throw new Error(
      "Prisma DMMF is not available. Ensure `prisma generate` has been run so that @prisma/client is initialised."
    );
  }
  datamodelCache = dmmf.datamodel;
  return datamodelCache;
}

function getModels() {
  return getDatamodel().models;
}

function getEnums() {
  return getDatamodel().enums;
}

const mkdirp = async (dir: string) => {
  await fs.mkdir(dir, { recursive: true });
};

const pickField = (
  model: Model,
  predicate: (field: FieldMeta) => boolean,
  preferredNames: string[] = []
) => {
  const candidates = model.fields.filter(predicate);
  if (candidates.length === 0) return undefined;
  const decorated = candidates.map((field) => {
    const exact = preferredNames.includes(field.name) ? 5 : 0;
    const weight = preferredNames.reduce((sum, pref) => {
      const normalized = pref.toLowerCase();
      const contains = field.name.toLowerCase().includes(normalized);
      return sum + (contains ? 2 : 0);
    }, exact);
    return { field, weight };
  });
  decorated.sort((a, b) => b.weight - a.weight);
  return decorated[0]?.field ?? candidates[0];
};

const score = (value: string, ...tokens: string[]) =>
  tokens.reduce(
    (acc, token) => (value.toLowerCase().includes(token.toLowerCase()) ? acc + 1 : acc),
    0
  );

function inferCandidateModel() {
  const models = getModels();
  const ranked = models
    .map((model) => {
      const stringFields = model.fields.filter(
        (f) => f.kind === "scalar" && f.type === "String"
      );
      const nameFieldScore = stringFields.filter((f) =>
        /(name|first|last|preferred|given|family|full)/i.test(f.name)
      ).length;
      const membership = stringFields.some((f) => /(member|membership|reg|number|no)/i.test(f.name));
      const relationCount = model.fields.filter((f) => f.kind === "object").length;
      const heuristic =
        nameFieldScore * 3 +
        (membership ? 2 : 0) +
        (relationCount > 0 ? 1 : 0) +
        score(model.name, "candidate", "member", "person", "brother");
      return { model, heuristic };
    })
    .sort((a, b) => b.heuristic - a.heuristic);
  return ranked[0]?.model;
}

function inferWorkingModel() {
  const models = getModels();
  const ranked = models
    .map((model) => {
      const hasDate = model.fields.some((f) => f.type === "DateTime");
      const lodgeRelation = model.fields.some(
        (f) => f.kind === "object" && /(lodge|chapter|craft)/i.test(f.name)
      );
      const heuristic =
        (hasDate ? 3 : 0) +
        (lodgeRelation ? 2 : 0) +
        score(model.name, "working", "work", "meeting", "ceremony", "event");
      return { model, heuristic };
    })
    .sort((a, b) => b.heuristic - a.heuristic);
  return ranked[0]?.model;
}

function inferJoinModel(candidateModelName: string, workingModelName: string) {
  const models = getModels();
  const ranked = models
    .map((model) => {
      const relationTargets = model.fields
        .filter((f) => f.kind === "object")
        .map((f) => f.type as string);
      const linksCandidate = relationTargets.includes(candidateModelName);
      const linksWorking = relationTargets.includes(workingModelName);
      const hasCeremony = model.fields.some(
        (f) =>
          (f.kind === "enum" || f.type === "String") &&
          /(ceremony|degree|initiat|pass|rais|affil|re.?oblig)/i.test(f.name)
      );
      const heuristic =
        (linksCandidate ? 3 : 0) +
        (linksWorking ? 3 : 0) +
        (hasCeremony ? 2 : 0) +
        score(model.name, "candidate", "progress", "attendance", "journey", "step");
      return { model, heuristic };
    })
    .sort((a, b) => b.heuristic - a.heuristic);
  return ranked[0]?.model;
}

export function inferGsrMapping(): GsrMapping {
  const models = getModels();
  const enumByName = Object.fromEntries(getEnums().map((e) => [e.name, e]));
  const candidateModel = inferCandidateModel();
  if (!candidateModel) {
    throw new Error("Could not infer candidate model from Prisma schema");
  }

  const workingModel = inferWorkingModel();
  if (!workingModel) {
    throw new Error("Could not infer working model from Prisma schema");
  }

  const joinModel = inferJoinModel(candidateModel.name, workingModel.name);
  if (!joinModel) {
    throw new Error("Could not infer candidate-working join model");
  }

  const candidateId = pickField(candidateModel, (f) => f.isId || f.isUnique)?.name ?? "id";
  const candidateNameFields = candidateModel.fields
    .filter((f) => f.type === "String" && /(name|first|last|preferred|full)/i.test(f.name))
    .map((f) => f.name);
  if (candidateNameFields.length === 0) {
    throw new Error(`Candidate model ${candidateModel.name} lacks identifiable name fields`);
  }
  const candidateMembershipField =
    candidateModel.fields.find(
      (f) => f.type === "String" && /(member|membership|reg|number|no)/i.test(f.name)
    )?.name ?? null;

  const workingId = pickField(workingModel, (f) => f.isId || f.isUnique)?.name ?? "id";
  const workingDate = pickField(workingModel, (f) => f.type === "DateTime", [
    "date",
    "occurredAt",
    "when",
    "heldOn",
    "meetingDate",
  ])?.name;
  if (!workingDate) {
    throw new Error(`Working model ${workingModel.name} lacks a date field`);
  }

  const workingTypeField = workingModel.fields.find(
    (f) =>
      ((f.kind === "enum" && /(type|degree|working|ceremony)/i.test(f.name)) ||
        (f.type === "String" && /(type|degree|working|ceremony)/i.test(f.name)))
  )?.name ?? null;
  const workingNotesField = workingModel.fields.find(
    (f) => f.type === "String" && /(note|remark|comment)/i.test(f.name)
  )?.name ?? null;

  const lodgeRelationField =
    workingModel.fields.find((f) => f.kind === "object" && /(lodge|chapter|craft)/i.test(f.name))?.name ??
    workingModel.fields.find((f) => f.kind === "object")?.name;
  if (!lodgeRelationField) {
    throw new Error(`Working model ${workingModel.name} lacks a lodge relation`);
  }

  const lodgeModelName = workingModel.fields.find((f) => f.name === lodgeRelationField)?.type as string;
  const lodgeModel = models.find((m) => m.name === lodgeModelName);
  if (!lodgeModel) {
    throw new Error(`Could not resolve lodge model for relation ${lodgeRelationField}`);
  }

  const lodgeId = pickField(lodgeModel, (f) => f.isId || f.isUnique)?.name ?? "id";
  const lodgeNameField = pickField(lodgeModel, (f) => f.type === "String", ["name", "lodgeName"])
    ?.name;
  if (!lodgeNameField) {
    throw new Error(`Lodge model ${lodgeModel.name} lacks a name field`);
  }
  const lodgeNumberField =
    lodgeModel.fields.find(
      (f) => (f.type === "String" || f.type === "Int") && /(number|no)/i.test(f.name)
    )?.name ?? null;

  const joinId = pickField(joinModel, (f) => f.isId || f.isUnique)?.name ?? "id";
  const candidateRelationField =
    joinModel.fields.find((f) => f.kind === "object" && f.type === candidateModel.name)?.name ??
    joinModel.fields.find((f) => f.kind === "object" && /(cand|person|member)/i.test(f.name))?.name;
  const workingRelationField =
    joinModel.fields.find((f) => f.kind === "object" && f.type === workingModel.name)?.name ??
    joinModel.fields.find((f) => f.kind === "object" && /(work|meet|event|ceremony)/i.test(f.name))?.name;
  if (!candidateRelationField || !workingRelationField) {
    throw new Error(`Join model ${joinModel.name} lacks candidate or working relations`);
  }

  const ceremonyField = joinModel.fields.find(
    (f) =>
      (f.kind === "enum" || f.type === "String") &&
      /(ceremony|degree|initiat|pass|rais|affil|re.?oblig)/i.test(f.name)
  )?.name;
  if (!ceremonyField) {
    throw new Error(`Join model ${joinModel.name} lacks a ceremony field`);
  }

  const resultField = joinModel.fields.find(
    (f) =>
      (f.kind === "enum" || f.type === "String") && /(result|status|outcome)/i.test(f.name)
  )?.name ?? null;

  const remarksField = joinModel.fields.find(
    (f) => f.type === "String" && /(note|remark|comment)/i.test(f.name)
  )?.name ?? null;

  const ceremonyEnumField = joinModel.fields.find(
    (f) => f.kind === "enum" && f.name === ceremonyField
  );
  const resultEnumField = resultField
    ? joinModel.fields.find((f) => f.kind === "enum" && f.name === resultField)
    : undefined;

  const ceremonyEnum = ceremonyEnumField
    ? {
        name: ceremonyEnumField.type as string,
        values: enumByName[ceremonyEnumField.type as string]?.values.map((v) => v.name) ?? [],
      }
    : undefined;
  const resultEnum = resultEnumField
    ? {
        name: resultEnumField.type as string,
        values: enumByName[resultEnumField.type as string]?.values.map((v) => v.name) ?? [],
      }
    : undefined;

  return {
    candidate: {
      model: candidateModel.name,
      id: candidateId,
      nameFields: candidateNameFields,
      membershipNumber: candidateMembershipField,
    },
    lodge: {
      model: lodgeModel.name,
      id: lodgeId,
      name: lodgeNameField,
      number: lodgeNumberField,
    },
    working: {
      model: workingModel.name,
      id: workingId,
      date: workingDate,
      type: workingTypeField,
      lodgeRel: lodgeRelationField,
      notes: workingNotesField ?? undefined,
    },
    candidateWorking: {
      model: joinModel.name,
      id: joinId,
      candidateRel: candidateRelationField,
      workingRel: workingRelationField,
      ceremony: ceremonyField,
      result: resultField ?? undefined,
      remarks: remarksField ?? undefined,
    },
    ceremonyEnum,
    resultEnum,
  };
}

function hasModel(name: string) {
  return getModels().some((m) => m.name === name);
}

function hasField(modelName: string, fieldName: string | null | undefined) {
  if (!fieldName) return true;
  const model = getModels().find((m) => m.name === modelName);
  if (!model) return false;
  return model.fields.some((f) => f.name === fieldName);
}

function mappingLooksValid(mapping: GsrMapping) {
  const { candidate, lodge, working, candidateWorking } = mapping;
  if (!hasModel(candidate.model) || !hasModel(lodge.model) || !hasModel(working.model) || !hasModel(candidateWorking.model)) {
    return false;
  }
  if (!hasField(candidate.model, candidate.id)) return false;
  if (!candidate.nameFields.every((field) => hasField(candidate.model, field))) return false;
  if (candidate.membershipNumber && !hasField(candidate.model, candidate.membershipNumber)) return false;
  if (!hasField(lodge.model, lodge.id) || !hasField(lodge.model, lodge.name)) return false;
  if (lodge.number && !hasField(lodge.model, lodge.number)) return false;
  if (!hasField(working.model, working.id) || !hasField(working.model, working.date)) return false;
  if (working.type && !hasField(working.model, working.type)) return false;
  if (!hasField(working.model, working.lodgeRel)) return false;
  if (working.notes && !hasField(working.model, working.notes)) return false;
  if (!hasField(candidateWorking.model, candidateWorking.id)) return false;
  if (!hasField(candidateWorking.model, candidateWorking.candidateRel)) return false;
  if (!hasField(candidateWorking.model, candidateWorking.workingRel)) return false;
  if (!hasField(candidateWorking.model, candidateWorking.ceremony)) return false;
  if (candidateWorking.result && !hasField(candidateWorking.model, candidateWorking.result)) return false;
  if (candidateWorking.remarks && !hasField(candidateWorking.model, candidateWorking.remarks)) return false;
  const enums = getEnums();
  if (mapping.ceremonyEnum) {
    const en = enums.find((e) => e.name === mapping.ceremonyEnum?.name);
    if (!en) return false;
  }
  if (mapping.resultEnum) {
    const en = enums.find((e) => e.name === mapping.resultEnum?.name);
    if (!en) return false;
  }
  return true;
}

let cachedMapping: GsrMapping | null = null;
let pendingPromise: Promise<GsrMapping> | null = null;

async function readMappingFromDisk(): Promise<GsrMapping | null> {
  try {
    const raw = await fs.readFile(MAPPING_PATH, "utf8");
    if (!raw.trim()) return null;
    const parsed = JSON.parse(raw);
    return parsed as GsrMapping;
  } catch (error: any) {
    if (error && (error.code === "ENOENT" || error.code === "ENOTDIR")) {
      return null;
    }
    console.warn("Failed to read GSR mapping, will re-infer", error);
    return null;
  }
}

async function writeMapping(mapping: GsrMapping) {
  await mkdirp(path.dirname(MAPPING_PATH));
  await fs.writeFile(MAPPING_PATH, JSON.stringify(mapping, null, 2), "utf8");
}

export async function saveGsrMapping(mapping: GsrMapping): Promise<GsrMapping> {
  await writeMapping(mapping);
  cachedMapping = mapping;
  return mapping;
}

export async function loadGsrMapping(): Promise<GsrMapping> {
  if (cachedMapping) return cachedMapping;
  if (pendingPromise) return pendingPromise;
  pendingPromise = (async () => {
    let existing = await readMappingFromDisk();
    if (!existing || !mappingLooksValid(existing)) {
      const inferred = inferGsrMapping();
      await writeMapping(inferred);
      cachedMapping = inferred;
      pendingPromise = null;
      return inferred;
    }
    cachedMapping = existing;
    pendingPromise = null;
    return existing;
  })();
  return pendingPromise;
}

export function availableModels() {
  return getModels().map((model) => ({
    name: model.name,
    fields: model.fields.map((field) => ({
      name: field.name,
      kind: field.kind,
      type: field.type,
      isList: field.isList,
      isRequired: field.isRequired,
      isId: field.isId,
      isUnique: field.isUnique,
    })),
  }));
}

export function availableEnums() {
  return getEnums().map((en) => ({ name: en.name, values: en.values.map((v) => v.name) }));
}
