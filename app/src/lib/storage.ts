// 本地存档（localStorage）——跨次状态以服务端持久化为主，前端用 localStorage 兜底。
// 本期无后端：进度/星级/历史全部落在本地 dandanniao:save:v1，OAuth 同步为预留。

import type { Score } from "./types";
import { SAVE_KEY, UID_KEY, FAV_KEY } from "./constants";

export interface SaveState {
  uid: string;
  levelStars: Record<string, 0 | 1 | 2 | 3>;
  bestScores: Record<string, number>;
  recent: Score[];
}

export function getUid(): string {
  if (typeof window === "undefined") return "";
  try {
    let uid = window.localStorage.getItem(UID_KEY);
    if (!uid) {
      uid = `u_guest_${Math.floor(1000 + Math.random() * 9000)}`;
      window.localStorage.setItem(UID_KEY, uid);
    }
    return uid;
  } catch {
    return "u_guest";
  }
}

export function loadSave(): SaveState {
  const empty: SaveState = { uid: getUid(), levelStars: {}, bestScores: {}, recent: [] };
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<SaveState>;
    return {
      uid: parsed.uid ?? empty.uid,
      levelStars: parsed.levelStars ?? {},
      bestScores: parsed.bestScores ?? {},
      recent: parsed.recent ?? [],
    };
  } catch {
    return empty;
  }
}

export function persistSave(state: SaveState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    /* 私有模式/空间不足：以服务端持久化为主，静默降级 */
  }
}

/** 提交一局成绩：更新星级/最高分/最近历史，返回是否刷新最高分 */
export function recordScore(levelId: number, score: number, stars: 0 | 1 | 2 | 3): boolean {
  const state = loadSave();
  const prev = state.bestScores[String(levelId)] ?? 0;
  const isNewBest = score > prev;
  if (isNewBest) state.bestScores[String(levelId)] = score;
  const prevStars = state.levelStars[String(levelId)] ?? 0;
  if (stars > prevStars) state.levelStars[String(levelId)] = stars;
  state.recent = [
    { levelId, score, stars, playedAt: new Date().toISOString(), isNewBest },
    ...state.recent,
  ].slice(0, 20);
  persistSave(state);
  return isNewBest;
}

export function clearSave(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SAVE_KEY);
  } catch {
    /* ignore */
  }
}

export function isFavorited(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(FAV_KEY) === "1";
  } catch {
    return false;
  }
}

export function setFavorited(v: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (v) window.localStorage.setItem(FAV_KEY, "1");
    else window.localStorage.removeItem(FAV_KEY);
  } catch {
    /* ignore */
  }
}