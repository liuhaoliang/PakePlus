// 《弹弓小队》—— 全站类型定义（DTO，服务端/前端对齐）

export type Chapter = "jungle" | "desert" | "snow" | "town";
export type MarbleType = "fire" | "ice" | "thunder";
export type BlockKind = "wood" | "glass" | "stone" | "iron";

export interface MarbleSlot {
  type: MarbleType;
  count: number;
}

/** 堡垒障碍物（世界坐标 1280x720 逻辑像素） */
export interface ObstacleDef {
  kind: BlockKind;
  shape: "box" | "plank";
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 软泥怪目标 */
export interface TargetDef {
  x: number;
  y: number;
  r: number;
}

export interface LevelDetail {
  id: string;
  name: string;
  chapter: Chapter;
  chapterName: string;
  theme: Chapter;
  thumbnail: string;
  /** 可用弹珠（发射物） */
  marbles: MarbleSlot[];
  /** 需要击倒的软泥怪数量 */
  targets: number;
  /** 解锁本关所需的累计星数 */
  unlockStars: number;
  /** 示例存档（公开 mock 展示用；玩家真实进度在 localStorage） */
  stars: number;
  bestScore: number;
  locked: boolean;
  isDaily: boolean;
  autoSave: boolean;
  obstacles: ObstacleDef[];
  targetDefs: TargetDef[];
}

export interface LeaderboardEntry {
  rank: number;
  nickname: string;
  avatar: string;
  totalStars: number;
  score: number;
}

export interface GuideSection {
  heading: string;
  body: string;
  image: string;
}

export interface Guide {
  slug: string;
  title: string;
  abstract: string;
  cover: string;
  date: string;
  sections: GuideSection[];
  relatedLevels: string[];
}

export interface ShareInfo {
  shareId: string;
  nickname: string;
  levelId: string;
  levelName: string;
  score: number;
  stars: number;
  date: string;
  cover: string;
}

/** 单关本地进度 */
export interface LevelProgress {
  stars: number;
  score: number;
  cleared: boolean;
}

/** 全部本地进度（key = levelId） */
export type ProgressMap = Record<string, LevelProgress>;