export const PREFIX_OPTIONS = [
  "Bro.", "WBro.", "VWBro.", "RWBro.", "MWBro."
];

export const POST_NOMINAL_OPTIONS = [
  "O.S.M.",
  "R.H.",
];

// Mapping borrowed from earlier app conventions (edit as needed).
// When a grand rank is selected, we'll auto-suggest prefix + grand post-nominals.
export const GRAND_RANK_OPTIONS = [
  "(None)",
  "Grand Steward",
  "Grand Standard Bearer",
  "Assistant Grand Director of Ceremonies",
  "Junior Grand Deacon",
  "Senior Grand Deacon",
  "Assistant Grand Master",
  "Deputy Grand Master",
  "Pro Grand Master",
] as const;

export type GrandRank = typeof GRAND_RANK_OPTIONS[number];

export const GRAND_POST_NOMINAL_OPTIONS = [
  "PGM", "DGM", "AGM", "GDC", "JGD", "SGD", "GSwdB", "GStB"
];

export const GRAND_RANK_MAP: Record<string, { prefix: string; grandPostNominals: string[]; extraPostNominals?: string[] }> = {
  "Grand Steward": { prefix: "WBro.", grandPostNominals: ["GStB"] },
  "Grand Standard Bearer": { prefix: "WBro.", grandPostNominals: ["GSwdB"] },
  "Assistant Grand Director of Ceremonies": { prefix: "WBro.", grandPostNominals: ["GDC"] },
  "Junior Grand Deacon": { prefix: "WBro.", grandPostNominals: ["JGD"] },
  "Senior Grand Deacon": { prefix: "WBro.", grandPostNominals: ["SGD"] },
  "Assistant Grand Master": { prefix: "RWBro.", grandPostNominals: ["AGM"] },
  "Deputy Grand Master": { prefix: "RWBro.", grandPostNominals: ["DGM"] },
  "Pro Grand Master": { prefix: "MWBro.", grandPostNominals: ["PGM"] },
};

export const WORK_TYPE_OPTIONS = [
  { value: "INITIATION", label: "Initiation" },
  { value: "PASSING", label: "Passing" },
  { value: "RAISING", label: "Raising" },
  { value: "INSTALLATION", label: "Installation" },
  { value: "PRESENTATION", label: "Presentation" },
  { value: "LECTURE", label: "Lecture" },
  { value: "OTHER", label: "Other" },
];

export const REGIONS = [
  "Northern","Central","Southern","Overseas"
];
