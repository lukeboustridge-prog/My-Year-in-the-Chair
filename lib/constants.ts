export const RANK_OPTIONS = [
  "Master Mason",
  "Installed Master",
  "Past Master",
  "Grand Steward",
  "Grand Standard Bearer",
  "Assistant Grand Director of Ceremonies",
  "Junior Grand Deacon",
  "Senior Grand Deacon",
  "Grand Director of Ceremonies",
  "Assistant Grand Master",
  "Deputy Grand Master",
  "Pro Grand Master",
  "Grand Master",
] as const;

export type Rank = typeof RANK_OPTIONS[number];

export const RANK_META: Record<string, { prefix: string; postNominals: string[]; grand?: boolean }> = {
  "Master Mason": { prefix: "Bro.", postNominals: [] },
  "Installed Master": { prefix: "WBro.", postNominals: [] },
  "Past Master": { prefix: "WBro.", postNominals: ["P.M."] },
  "Grand Steward": { prefix: "WBro.", postNominals: ["GStB"], grand: true },
  "Grand Standard Bearer": { prefix: "WBro.", postNominals: ["GSwdB"], grand: true },
  "Assistant Grand Director of Ceremonies": { prefix: "WBro.", postNominals: ["GDC"], grand: true },
  "Junior Grand Deacon": { prefix: "WBro.", postNominals: ["JGD"], grand: true },
  "Senior Grand Deacon": { prefix: "WBro.", postNominals: ["SGD"], grand: true },
  "Grand Director of Ceremonies": { prefix: "WBro.", postNominals: ["GDC"], grand: true },
  "Assistant Grand Master": { prefix: "RWBro.", postNominals: ["AGM"], grand: true },
  "Deputy Grand Master": { prefix: "RWBro.", postNominals: ["DGM"], grand: true },
  "Pro Grand Master": { prefix: "MWBro.", postNominals: ["PGM"], grand: true },
  "Grand Master": { prefix: "MWBro.", postNominals: ["G.M."], grand: true },
};

export function deriveTitle(rank: string, isPastGrand: boolean) {
  const meta = RANK_META[rank];
  if (!meta) return { prefix: "Bro.", postNominals: [] };
  if (isPastGrand && meta.grand) {
    const pastMap: Record<string, string> = {
      "GStB": "PGStB",
      "GSwdB": "PGSwdB",
      "GDC": "PGDC",
      "JGD": "PJGD",
      "SGD": "PSGD",
      "AGM": "PAGM",
      "DGM": "PDGM",
      "PGM": "PPGM",
      "G.M.": "P.G.M.",
    };
    const post = meta.postNominals.map(x => pastMap[x] ?? x);
    return { prefix: meta.prefix, postNominals: post };
  }
  return { prefix: meta.prefix, postNominals: meta.postNominals };
}

/* Regions kept for profile select if needed later */
export const REGIONS = [
  "Northern","Central","Southern","Overseas"
];

/* --- Build fix: re-add WORK_TYPE_OPTIONS for visits page --- */
export const WORK_TYPE_OPTIONS = [
  { value: "INITIATION", label: "Initiation" },
  { value: "PASSING", label: "Passing" },
  { value: "RAISING", label: "Raising" },
  { value: "INSTALLATION", label: "Installation" },
  { value: "PRESENTATION", label: "Presentation" },
  { value: "LECTURE", label: "Lecture" },
  { value: "OTHER", label: "Other" },
];
