import { strict as assert } from "node:assert";
import test from "node:test";
import { Prisma } from "@prisma/client";
import { availableModels, inferGsrMapping } from "@/lib/reports/gsrMapping";

const hasDmmf = Boolean((Prisma as any)?.dmmf?.datamodel);

test("inferGsrMapping selects existing models and fields", { skip: !hasDmmf }, () => {
  const mapping = inferGsrMapping();
  const models = availableModels();
  const modelLookup = new Map(models.map((model) => [model.name, model]));

  const requiredModels: Array<[string, string[]]> = [
    ["candidate", [mapping.candidate.model, mapping.candidate.id, ...mapping.candidate.nameFields]],
    ["lodge", [mapping.lodge.model, mapping.lodge.id, mapping.lodge.name].concat(
      mapping.lodge.number ? [mapping.lodge.number] : []
    )],
    ["working", [
      mapping.working.model,
      mapping.working.id,
      mapping.working.date,
      mapping.working.lodgeRel,
    ].concat([
      mapping.working.type ?? "",
      mapping.working.notes ?? "",
    ].filter(Boolean))],
    ["candidateWorking", [
      mapping.candidateWorking.model,
      mapping.candidateWorking.id,
      mapping.candidateWorking.candidateRel,
      mapping.candidateWorking.workingRel,
      mapping.candidateWorking.ceremony,
    ].concat([
      mapping.candidateWorking.result ?? "",
      mapping.candidateWorking.remarks ?? "",
    ].filter(Boolean))],
  ];

  for (const [, entries] of requiredModels) {
    const [modelName, ...fields] = entries;
    const model = modelLookup.get(modelName);
    assert.ok(model, `Model ${modelName} should exist in Prisma DMMF`);
    for (const field of fields) {
      if (!field) continue;
      assert.ok(
        model?.fields.some((item) => item.name === field),
        `Field ${modelName}.${field} should exist`
      );
    }
  }

  const dmmfEnums = new Map(Prisma.dmmf.datamodel.enums.map((en) => [en.name, en]));
  if (mapping.ceremonyEnum) {
    assert.ok(dmmfEnums.has(mapping.ceremonyEnum.name));
  }
  if (mapping.resultEnum) {
    assert.ok(dmmfEnums.has(mapping.resultEnum.name));
  }
});
