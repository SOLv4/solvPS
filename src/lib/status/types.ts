export interface StatsData {
  user: {
    handle: string;
    tier: number;
    tierName: string;
    rating: number;
    solvedCount: number;
    maxStreak: number;
    rank: number | null;
  };
  radarTags: {
    tag: string;
    name: string;
    solved: number;
    total: number;
    solveRate: number;
  }[];
  weakTags: {
    tag: string;
    name: string;
    solved: number;
    total: number;
    tried: number;
    solveRate: number;
  }[];
  levelHistogram: {
    label: string;
    solved: number;
    total: number;
    color: string;
    pct: number;
  }[];
  classProgress: {
    class: number;
    total: number;
    totalSolved: number;
    essentials: number;
    essentialSolved: number;
    decoration: string | null;
    pct: number;
  }[];
  nextClassInfo: {
    class: number;
    essentialLeft: number;
    totalLeft: number;
  } | null;
  styleData: {
    easy: number;
    normal: number;
    hard: number;
    veryHard: number;
    topTags: { name: string; count: number }[];
    hardestLevel: number;
    styleLabel: string;
  };
  siteInfo: {
    totalUsers: number;
    totalProblems: number;
  };
}

export interface RivalData {
  me: { handle: string; tierName: string; rating: number };
  rival: { handle: string; tierName: string; rating: number };
  comparison: {
    tag: string;
    name: string;
    me: number;
    rival: number;
    diff: number;
  }[];
}
