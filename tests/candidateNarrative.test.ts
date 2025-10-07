import { strict as assert } from "node:assert";
import test from "node:test";
import { candidateNarrative } from "@/lib/reports/gsrNarrative";
import type { CandidateBlock, ProgressEvent } from "@/lib/reports/gsrTypes";

function makeEvent(partial: Partial<ProgressEvent>): ProgressEvent {
  return {
    date: partial.date ?? new Date("2024-01-01"),
    ceremony: partial.ceremony ?? "INITIATION",
    lodgeName: partial.lodgeName ?? "Unity Lodge",
    result: partial.result ?? null,
    notes: partial.notes ?? null,
  };
}

test("candidate narrative covers full progression", () => {
  const block: CandidateBlock = {
    id: "1",
    name: "John Smith",
    timeline: [
      makeEvent({ ceremony: "INITIATION", date: new Date("2024-01-10") }),
      makeEvent({ ceremony: "PASSING", date: new Date("2024-03-05") }),
      makeEvent({ ceremony: "RAISING", date: new Date("2024-06-22") }),
    ],
  };
  const text = candidateNarrative(block);
  assert.equal(
    text,
    "John Smith was initiated on 10 January 2024, passed on 5 March 2024, and was raised on 22 June 2024."
  );
});

test("candidate narrative indicates awaiting next step", () => {
  const block: CandidateBlock = {
    id: "2",
    name: "Jane Doe",
    timeline: [makeEvent({ ceremony: "INITIATION", date: new Date("2024-02-14") })],
  };
  const text = candidateNarrative(block);
  assert.equal(text, "Jane Doe was initiated on 14 February 2024 and awaits passing.");
});

test("candidate narrative highlights postponed results", () => {
  const block: CandidateBlock = {
    id: "3",
    name: "Michael Lee",
    timeline: [
      makeEvent({
        ceremony: "PASSING",
        date: new Date("2024-04-18"),
        result: "Postponed due to illness",
      }),
    ],
  };
  const text = candidateNarrative(block);
  assert.equal(
    text,
    "Michael Lee passed on 18 April 2024 (Postponed due to illness) and awaits raising."
  );
});
