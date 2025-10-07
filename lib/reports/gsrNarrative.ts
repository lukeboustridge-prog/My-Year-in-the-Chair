import type { CandidateBlock, Ceremony, ProgressEvent } from "./gsrTypes";

const knownCeremonyTokens: Record<string, Ceremony> = {
  INITIATION: "INITIATION",
  INITIATE: "INITIATION",
  INITIATED: "INITIATION",
  PASSING: "PASSING",
  PASSED: "PASSING",
  PASS: "PASSING",
  RAISING: "RAISING",
  RAISED: "RAISING",
  RAISE: "RAISING",
  AFFILIATION: "AFFILIATION",
  AFFILIATE: "AFFILIATION",
  AFFILIATED: "AFFILIATION",
  REOBLIGATION: "RE-OBLIGATION",
  "RE-OBLIGATION": "RE-OBLIGATION",
  REOBLIGATED: "RE-OBLIGATION",
  REOBLIGATE: "RE-OBLIGATION",
};

export function normalizeCeremony(value: string | null | undefined): Ceremony {
  if (!value) return "";
  const trimmed = value.toString().trim();
  const normalized = trimmed.replace(/[^a-z0-9]+/gi, "").toUpperCase();
  return knownCeremonyTokens[normalized] ?? trimmed;
}

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function formatDate(date: Date) {
  return dateFormatter.format(date);
}

function ceremonyVerb(ceremony: Ceremony) {
  const canonical = normalizeCeremony(ceremony);
  switch (canonical) {
    case "INITIATION":
      return "was initiated";
    case "PASSING":
      return "passed";
    case "RAISING":
      return "was raised";
    case "AFFILIATION":
      return "affiliated";
    case "RE-OBLIGATION":
      return "underwent re-obligation";
    default:
      return `attended ${ceremony.toString().toLowerCase()}`;
  }
}

function detectPostponed(value?: string | null) {
  if (!value) return false;
  return /(postponed|deferred|abandoned|cancelled|canceled)/i.test(value);
}

function awaitingStatement(block: CandidateBlock) {
  const ceremonies = block.timeline.map((event) => normalizeCeremony(event.ceremony));
  const hasInitiation = ceremonies.includes("INITIATION");
  const hasPassing = ceremonies.includes("PASSING");
  const hasRaising = ceremonies.includes("RAISING");
  if (hasInitiation && !hasPassing) return "awaits passing";
  if (hasPassing && !hasRaising) return "awaits raising";
  return null;
}

export function candidateNarrative(block: CandidateBlock): string {
  if (block.timeline.length === 0) {
    return `${block.name} has no recorded ceremonies in this period.`;
  }
  const phrases = block.timeline.map((event) => {
    const canonical = normalizeCeremony(event.ceremony);
    const verb = ceremonyVerb(canonical);
    const date = formatDate(event.date);
    let phrase = `${verb} on ${date}`;
    if (detectPostponed(event.result) || detectPostponed(event.notes)) {
      const reason = event.result ?? event.notes;
      if (reason) {
        phrase += ` (${reason.trim()})`;
      }
    } else if (event.result && event.result !== "COMPLETED") {
      phrase += ` (${event.result})`;
    }
    return phrase;
  });

  let narrative = `${block.name} ${phrases[0]}`;
  if (phrases.length === 1) {
    const awaiting = awaitingStatement(block);
    if (awaiting) {
      narrative += ` and ${awaiting}.`;
    } else {
      narrative += ".";
    }
    return narrative;
  }

  if (phrases.length === 2) {
    narrative += ` and ${phrases[1]}`;
  } else {
    const leading = phrases.slice(1, -1).join(", ");
    narrative += `, ${leading}, and ${phrases[phrases.length - 1]}`;
  }

  const awaiting = awaitingStatement(block);
  if (awaiting) {
    narrative += `, and ${awaiting}.`;
  } else {
    narrative += ".";
  }
  return narrative;
}

export type { CandidateBlock, Ceremony, ProgressEvent };
