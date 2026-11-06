// 弹弹鸟：鸟蛋保卫战 —— 领域类型（DTO，服务端与前端对齐）
export type BirdType = "red" | "yellow" | "blue";

export type PigTier = "normal" | "king";

export type BlockMaterial = "wood" | "stone" | "glass";

export interface PigBody {
  x: number;
  y: number;
  r: number;
  hp: number;
  tier: PigTier;
}

export interface BlockBody {
  x: number;
  y: number;
  w: number;
  h: number;
  material: BlockMaterial;
  angle?: number;
}

export interface LevelLayout {
  slingshot: { x: number; y: number };
  groundY: number;
  pigs: PigBody[];
  blocks: BlockBody[];
}

export interface Level {
  id: number;
  chapter: 1 | 2 | 3;
  chapterName: string;
  name: string;
  displayName: string;
  difficulty: 1 | 2 | 3;
  targetScore: number;
  starScore: [number, number];
  availableBirds: BirdType[];
  tip: string;
  unlockRule: "none" | number;
  layout: LevelLayout;
}

export interface LeaderboardEntry {
  rank: number;
  uid: string;
  nickname: string;
  avatarColor: string;
  totalScore: number;
  cleared: number;
  maxLevelScore?: number;
  levelId?: number;
}

export interface Score {
  levelId: number;
  score: number;
  stars: 0 | 1 | 2 | 3;
  playedAt: string;
  isNewBest: boolean;
}

export interface MeProfile {
  uid: string;
  nickname: string;
  avatarColor: string;
  cleared: number;
  totalStars: number;
  bestTotal: number;
  levelStars: Record<number, 0 | 1 | 2 | 3>;
  recent: Score[];
}

export interface GuideArticle {
  slug: string;
  title: string;
  summary: string;
  sections: { heading: string; body: string }[];
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface ApiResp<T> {
  code: number;
  message: string;
  data: T;
  page?: { page: number; pageSize: number; total: number; hasMore: boolean };
}