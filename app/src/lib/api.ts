// 接口层统一入口：SSR/CSR 同源。优先走本地 Route Handlers（Next app/api），
// 失败时兜底到 lib/mock/data 的纯内存数据，保证 SSG/SSR 期不整页降级。

import type { ApiResp, LeaderboardEntry, Level, MeProfile, Score } from "./types";
import { FAQ, GUIDES, LEADERBOARD, LEVELS, getLevel, getLevelLeaderboard, nextLevelId, paginate } from "./mock/data";
import { SITE_ORIGIN } from "./constants";

const BASE = typeof window === "undefined" ? SITE_ORIGIN : "";

async function fetchJson<T>(path: string, init?: RequestInit): Promise<ApiResp<T>> {
  const res = await fetch(`${BASE}${path}`, { cache: "no-store", ...init });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as ApiResp<T>;
}

export async function apiLevels(chapter?: 1 | 2 | 3): Promise<Level[]> {
  try {
    const q = chapter ? `?chapter=${chapter}` : "";
    const resp = await fetchJson<Level[]>(`/api/levels${q}`);
    return resp.code === 0 ? resp.data : LEVELS;
  } catch {
    return chapter ? LEVELS.filter((l) => l.chapter === chapter) : LEVELS;
  }
}

export async function apiLevel(id: number): Promise<{ level: Level | undefined; nextId: number }> {
  try {
    const resp = await fetchJson<{ level: Level | undefined; nextId: number }>(`/api/levels/${id}`);
    if (resp.code === 0) return resp.data;
  } catch {
    /* fallthrough 到 mock */
  }
  return { level: getLevel(id), nextId: nextLevelId(id) };
}

export async function apiLeaderboard(type: "total" | "level", levelId?: number): Promise<LeaderboardEntry[]> {
  try {
    const q = new URLSearchParams({ type });
    if (type === "level" && levelId) q.set("levelId", String(levelId));
    const resp = await fetchJson<LeaderboardEntry[]>(`/api/leaderboard?${q.toString()}`);
    if (resp.code === 0) return resp.data;
  } catch {
    /* fallthrough */
  }
  return type === "total" ? LEADERBOARD : getLevelLeaderboard(levelId ?? 1);
}

export async function apiMe(): Promise<MeProfile> {
  try {
    const resp = await fetchJson<MeProfile>("/api/me");
    if (resp.code === 0) return resp.data;
  } catch {
    /* fallthrough */
  }
  return buildGuestMe();
}

export async function apiSubmitScore(score: Score): Promise<{ ok: boolean; isNewBest: boolean }> {
  try {
    const resp = await fetchJson<{ ok: boolean; isNewBest: boolean }>("/api/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(score),
    } as RequestInit);
    if (resp.code === 0) return resp.data;
  } catch {
    /* fallthrough */
  }
  return { ok: true, isNewBest: score.isNewBest };
}

function buildGuestMe(): MeProfile {
  return {
    uid: "u_guest",
    nickname: "游客",
    avatarColor: "#FFD23E",
    cleared: 0,
    totalStars: 0,
    bestTotal: 0,
    levelStars: {},
    recent: [],
  };
}

export { FAQ, GUIDES, LEADERBOARD, LEVELS, getLevel, getLevelLeaderboard, nextLevelId, paginate };