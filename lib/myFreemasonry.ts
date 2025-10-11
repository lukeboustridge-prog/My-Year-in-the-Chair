export type OfficeRecord = {
  office: string;
  years?: string;
  lodgeId?: string | null;
};

export type LodgeRecord = {
  id: string;
  name: string;
  number?: string | null;
  joinDate?: string | null;
  resignDate?: string | null;
};

export type AchievementMilestoneRecord = Record<string, string | null>;

export type MilestoneDefinition = {
  key: string;
  label: string;
  description?: string;
};

export const ACHIEVEMENT_MILESTONES: MilestoneDefinition[] = [
  { key: "25_YEAR_BADGE", label: "25 year badge" },
  { key: "50_YEAR_BADGE", label: "50 year badge" },
  { key: "60_YEAR_BADGE", label: "60 year badge" },
  { key: "70_YEAR_BADGE", label: "70 year badge" },
];

export function createEmptyMilestones(): AchievementMilestoneRecord {
  return ACHIEVEMENT_MILESTONES.reduce<AchievementMilestoneRecord>((acc, milestone) => {
    acc[milestone.key] = null;
    return acc;
  }, {});
}
