// 本地存档（localStorage）—— 游客/未登录进度；接口形状与未来服务端一致
import type { LevelProgress, ProgressMap } from "./types";

const KEY = "slingshot.progress.v1";

function hasWindow(): boolean {
  return typeof window !== "undefined";
}

export function loadProgress(): ProgressMap {
  if (!hasWindow()) return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as ProgressMap) : {};
  } catch {
    return {};
  }
}

export function saveProgress(map: ProgressMap): void {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    // 隐私模式/空间满：静默降级为「本局成绩不持久」
  }
}

/** 写入单关成绩（取历史最优）并返回新进度快照 */
export function recordResult(levelId: string, score: number, stars: number): ProgressMap {
  const map = loadProgress();
  const prev: LevelProgress | undefined = map[levelId];
  map[levelId] = {
    stars: Math.max(stars, prev?.stars ?? 0),
    score: Math.max(score, prev?.score ?? 0),
    cleared: true,
  };
  saveProgress(map);
  return map;
}

export function totalStarCount(map: ProgressMap): number {
  return Object.values(map).reduce((sum, p) => sum + (p?.stars ?? 0), 0);
}

/** 已清除关卡数 */
export function clearedCount(map: ProgressMap): number {
  return Object.values(map).filter((p) => p?.cleared).length;
}