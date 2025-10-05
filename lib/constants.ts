/**
 * Rank options start at Master Mason up to Grand Master.
 * Ticking "Past Grand Rank" will prefix relevant Grand ranks with "Past" in UI
 * but we store a boolean separately (isPastGrand) to keep data tidy.
 * You can expand this list from the BoC; these are common examples.
 */
export const RANK_OPTIONS = [
  "Master Mason",
  "Installed Master",
  "Past Master",
  // Grand ranks (non-past)
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

/**
 * For each rank, the default prefix and post-nominals.
 * For past grand rank ticked, we add the 'Past' form where appropriate
 * and post-nominal stays the same unless your jurisdiction uses a P- variant. Adjust here.
 */
export const RANK_META: Record<string, { prefix: string; postNominals: string[]; grand?: boolean }> = {
  "Master Mason": { prefix: "Bro.", postNominals: [] },
  "Installed Master": { prefix: "WBro.", postNominals: [] },
  "Past Master": { prefix: "WBro.", postNominals: ["P.M."] },

  // Grand (examples; expand from BoC as needed)
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

/**
 * Given a selected rank and whether it is a Past Grand rank, return the prefix & post-nominals.
 * If isPastGrand is true and the rank is grand, we keep the same post-nominals by default,
 * but you can change to use a Past variant if your BoC specifies different letters (e.g. "PGStB").
 */
export function deriveTitle(rank: string, isPastGrand: boolean) {
  const meta = RANK_META[rank];
  if (!meta) return { prefix: "Bro.", postNominals: [] };
  if (isPastGrand && meta.grand) {
    // Example: keep same post-nominals but add "Past" conceptually.
    // If your BoC uses P- variants (e.g., PGD, PJGD), map them here:
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
    // Prefix usually stays the same for Past Grand ranks; adjust if needed:
    return { prefix: meta.prefix, postNominals: post };
  }
  return { prefix: meta.prefix, postNominals: meta.postNominals };
}
