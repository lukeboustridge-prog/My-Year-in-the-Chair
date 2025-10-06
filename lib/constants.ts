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
export const RANK_META: Record<string, { prefix: string; post?: string }> = {
  'Entered Apprentice': { prefix: 'Bro' },
  'Fellow Craft': { prefix: 'Bro' },
  'Master Mason': { prefix: 'Bro' },
  'Installed Master': { prefix: 'WBro' },
  'Past Master': { prefix: 'WBro', post: 'PM' },
  'Grand Steward': { prefix: 'WBro', post: 'GStw' },
  'Grand Sword Bearer': { prefix: 'WBro', post: 'GSWB' },
  'Past Grand Steward': { prefix: 'WBro', post: 'PGStw' },
  'Past Grand Sword Bearer': { prefix: 'WBro', post: 'PGSWB' },
};

export const DATE_FMT = 'YYYY-MM-DD';

export const FMNZ_LOGO_URL =
  'https://freemasonsnz.org/wp-content/uploads/2024/05/Freemasons-logo-colour-blue-BG.png';

// Build a display title like "WBro Luke Boustridge GSWB"
export function deriveTitle(
  name: string,
  currentRank?: string | null,
  grandPost?: string | null
): string {
  const meta = (currentRank && RANK_META[currentRank]) || RANK_META['Master Mason'];
  const prefix = meta?.prefix || 'Bro';
  const post = grandPost || meta?.post || '';
  return [prefix, name, post].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}
