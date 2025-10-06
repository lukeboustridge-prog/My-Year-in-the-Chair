// lib/constants.ts

export const APP_NAME = 'My Year In The Chair';

// Options shown in profile selectors
export const RANK_OPTIONS = [
  'Entered Apprentice',
  'Fellow Craft',
  'Master Mason',
  'Installed Master',
  'Past Master',
  'Grand Steward',
  'Grand Sword Bearer',
  'Past Grand Steward',
  'Past Grand Sword Bearer',
];

// Metadata used to derive prefixes and post-nominals
export const RANK_META: Record<string, { prefix: string; post?: string; grand?: boolean }> = {
  'Entered Apprentice': { prefix: 'Bro', grand: false },
  'Fellow Craft': { prefix: 'Bro', grand: false },
  'Master Mason': { prefix: 'Bro', grand: false },
  'Installed Master': { prefix: 'WBro', grand: false },
  'Past Master': { prefix: 'WBro', post: 'PM', grand: false },
  'Grand Steward': { prefix: 'WBro', post: 'GStw', grand: true },
  'Grand Sword Bearer': { prefix: 'WBro', post: 'GSWB', grand: true },
  'Past Grand Steward': { prefix: 'WBro', post: 'PGStw', grand: true },
  'Past Grand Sword Bearer': { prefix: 'WBro', post: 'PGSWB', grand: true },
};

export const DATE_FMT = 'YYYY-MM-DD';

export const FMNZ_LOGO_URL =
  'https://freemasonsnz.org/wp-content/uploads/2024/05/Freemasons-logo-colour-blue-BG.png';

/**
 * Overloaded deriveTitle:
 * 1) deriveTitle(rank, isPastGrand) -> { prefix, postNominals[] }
 * 2) deriveTitle(name, currentRank?, grandPost?) -> string "Prefix Name Post"
 */
export function deriveTitle(rank: string, isPastGrand: boolean): { prefix: string; postNominals: string[] };
export function deriveTitle(name: string, currentRank?: string | null, grandPost?: string | null): string;
export function deriveTitle(a: string, b?: boolean | string | null, c?: string | null): any {
  // If second arg is boolean, return parts for profile state
  if (typeof b === 'boolean') {
    const rank = a || 'Master Mason';
    const meta = RANK_META[rank] || RANK_META['Master Mason'];
    const prefix = meta.prefix || 'Bro';
    // Build post-nominals as an array
    let post = meta.post || '';
    if (b) {
      // Simple heuristic: preprend 'P' if not already a Past grade, e.g. GStw -> PGStw
      if (post && !/^P/.test(post)) post = 'P' + post;
      if (!post && (meta.grand || /Grand/i.test(rank))) post = 'PG';
    }
    const postNominals = post ? [post] : [];
    return { prefix, postNominals };
  }

  // Otherwise, build a display line "Prefix Name Post"
  const name = a || '';
  const currentRank = (b as string | null | undefined) || 'Master Mason';
  const grandPost = c || '';
  const meta = RANK_META[currentRank] || RANK_META['Master Mason'];
  const prefix = meta?.prefix || 'Bro';
  const post = grandPost || meta?.post || '';
  return [prefix, name, post].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}
