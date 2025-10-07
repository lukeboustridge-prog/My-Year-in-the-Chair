export type Ceremony =
  | "INITIATION"
  | "PASSING"
  | "RAISING"
  | "AFFILIATION"
  | "RE-OBLIGATION"
  | string;

export type ProgressEvent = {
  date: Date;
  ceremony: Ceremony;
  lodgeName: string;
  result?: string | null;
  notes?: string | null;
};

export type CandidateBlock = {
  id: string;
  name: string;
  membershipNumber?: string | null;
  timeline: ProgressEvent[];
};

export type Summary = {
  totalCandidates: number;
  initiations: number;
  passings: number;
  raisings: number;
  affiliations: number;
  awaitingPassing: number;
  awaitingRaising: number;
};

export type ReportModel = {
  lodgeName: string;
  lodgeNumber?: string | null;
  from: Date;
  to: Date;
  wmName: string;
  wmPostNominals?: string | null;
  summary: Summary;
  candidates: CandidateBlock[];
  appendix: {
    rows: Array<{
      date: Date;
      lodge: string;
      ceremony: string;
      candidates: string;
      result?: string | null;
      notes?: string | null;
    }>;
  };
};
