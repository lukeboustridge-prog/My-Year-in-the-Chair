/**
 * lib/constants.ts — definitive version
 * Provides: RANK_OPTIONS, RANK_META, deriveTitle, REGIONS, WORK_TYPE_OPTIONS
 */

// ---------------- Ranks ----------------
export const RANK_OPTIONS = [
  // Craft
  "Brother",
  "Master Mason",
  "Worshipful Master",
  "Past Master",

  // Grand Lodge (ascending)
  "Grand Tyler",
  "Grand Steward",
  "Grand Inner Guard",
  "Grand Organist",
  "Grand Standard Bearer",
  "Grand Sword Bearer",
  "Grand Bible Bearer",
  "Senior Grand Deacon",
  "Junior Grand Deacon",

  // Very Worshipful offices (VWBro.)
  "Grand Director of Ceremonies",
  "Grand Lecturer",
  "Grand Superintendent of Research & Education",
  "Grand Superintendent of Ceremonies",
  "Grand Superintendent of Works",
  "Grand Treasurer",
  "Grand Registrar",
  "Grand Chaplain",
  "Grand Superintendent of Region",

  // Right Worshipful offices (RWBro.)
  "Grand Almoner",
  "Grand Secretary",
  "Junior Grand Warden",
  "Senior Grand Warden",
  "Divisional Grand Master",
  "Deputy Grand Master",

  // Most Worshipful (MWBro.)
  "Pro Grand Master",
  "Grand Master",
] as const;

export type Rank = typeof RANK_OPTIONS[number];

export const RANK_META: Record<string, { prefix: string; postNominals: string[]; grand?: boolean }> = {
  // Craft
  "Brother":                { prefix: "Bro.",  postNominals: [] },
  "Master Mason":           { prefix: "Bro.",  postNominals: [] },
  "Worshipful Master":      { prefix: "WBro.", postNominals: [] },
  "Past Master":            { prefix: "WBro.", postNominals: ["PM"] },

  // Grand Lodge (WBro.)
  "Grand Tyler":            { prefix: "WBro.", postNominals: ["G Tyr"],   grand: true },
  "Grand Steward":          { prefix: "WBro.", postNominals: ["GS"],      grand: true },
  "Grand Inner Guard":      { prefix: "WBro.", postNominals: ["G IG"],    grand: true },
  "Grand Organist":         { prefix: "WBro.", postNominals: ["GO"],      grand: true },
  "Grand Standard Bearer":  { prefix: "WBro.", postNominals: ["G Std B"], grand: true },
  "Grand Sword Bearer":     { prefix: "WBro.", postNominals: ["G Swd B"], grand: true },
  "Grand Bible Bearer":     { prefix: "WBro.", postNominals: ["GBB"],     grand: true },
  "Senior Grand Deacon":    { prefix: "WBro.", postNominals: ["SGD"],     grand: true },
  "Junior Grand Deacon":    { prefix: "WBro.", postNominals: ["JGD"],     grand: true },

  // Very Worshipful (VWBro.)
  "Grand Director of Ceremonies":                  { prefix: "VWBro.", postNominals: ["GDC"],           grand: true },
  "Grand Lecturer":                                { prefix: "VWBro.", postNominals: ["G Lec"],         grand: true },
  "Grand Superintendent of Research & Education":  { prefix: "VWBro.", postNominals: ["G Supt R&E"],    grand: true },
  "Grand Superintendent of Ceremonies":            { prefix: "VWBro.", postNominals: ["G Supt C"],      grand: true },
  "Grand Superintendent of Works":                 { prefix: "VWBro.", postNominals: ["G Supt W"],      grand: true },
  "Grand Treasurer":                               { prefix: "VWBro.", postNominals: ["GT"],            grand: true },
  "Grand Registrar":                               { prefix: "VWBro.", postNominals: ["GR"],            grand: true },
  "Grand Chaplain":                                { prefix: "VWBro.", postNominals: ["GC"],            grand: true },
  "Grand Superintendent of Region":                { prefix: "VWBro.", postNominals: ["G Supt"],        grand: true },

  // Right Worshipful (RWBro.)
  "Grand Almoner":                                 { prefix: "RWBro.", postNominals: ["G Alm"],         grand: true },
  "Grand Secretary":                               { prefix: "RWBro.", postNominals: ["G Sec"],         grand: true },
  "Junior Grand Warden":                           { prefix: "RWBro.", postNominals: ["JGW"],           grand: true },
  "Senior Grand Warden":                           { prefix: "RWBro.", postNominals: ["SGW"],           grand: true },
  "Divisional Grand Master":                       { prefix: "RWBro.", postNominals: ["Div GM"],        grand: true },
  "Deputy Grand Master":                           { prefix: "RWBro.", postNominals: ["Dep GM"],        grand: true },

  // Most Worshipful (MWBro.)
  "Pro Grand Master":                              { prefix: "MWBro.", postNominals: ["Pro GM"],        grand: true },
  "Grand Master":                                  { prefix: "MWBro.", postNominals: ["GM"],            grand: true },
};

export function deriveTitle(rank: string, isPastGrand: boolean) {
  const meta = RANK_META[rank];
  if (!meta) return { prefix: "Bro.", postNominals: [] };
  if (isPastGrand && meta.grand) {
    const pastMap: Record<string, string> = {
      "G Tyr": "P G Tyr",
      "GS": "PGS",
      "G IG": "P G IG",
      "GO": "PGO",
      "G Std B": "PG Std B",
      "G Swd B": "PG Swd B",
      "GBB": "PGBB",
      "SGD": "PSGD",
      "JGD": "PJGD",
      "GDC": "PGDC",
      "G Lec": "PG Lec",
      "G Supt R&E": "P G Supt R&E",
      "G Supt C": "P G Supt C",
      "G Supt W": "P G Supt W",
      "GT": "PGT",
      "GR": "PGR",
      "GC": "PGC",
      "G Supt": "P G Supt",
      "G Alm": "P G Alm",
      "G Sec": "P G Sec",
      "JGW": "PJGW",
      "SGW": "PSGW",
      "Div GM": "P Div GM",
      "Dep GM": "P Dep GM",
      "Pro GM": "P Pro GM",
      "GM": "PGM",
    };
    const post = meta.postNominals.map(x => pastMap[x] ?? x);
    return { prefix: meta.prefix, postNominals: post };
  }
  return { prefix: meta.prefix, postNominals: meta.postNominals };
}

// ---------------- Regions (expand as needed) ----------------
export const REGIONS = ["Northern","Central","Southern","Overseas"];

// ---------------- Work types (labels Title Case, values UPPER) ----------------
export const WORK_TYPE_OPTIONS = [
  { value: "INITIATION", label: "First Degree" },
  { value: "PASSING", label: "Second Degree" },
  { value: "RAISING", label: "Third Degree" },
  { value: "INSTALLATION", label: "Installation" },
  { value: "PRESENTATION", label: "Presentation" },
  { value: "LECTURE", label: "Lecture" },
  { value: "OTHER", label: "Other" },
];
