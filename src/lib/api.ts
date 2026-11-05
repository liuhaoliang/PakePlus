// 接口层：本期货真价实用「静态 mock + 本地存档」，但按未来真实后端形状设计。
// 成功壳 { ok:true, data }；列表 { list, total }；SSR/CSR 同源、不抛错致整页降级。
import { SITE_URL } from "./constants";
import { getGuide } from "./guide";
import { LEADERBOARD } from "./leaderboard";
import { getLevel, LEVELS } from "./levels";
import type { Guide, LeaderboardEntry, LevelDetail, ShareInfo } from "./types";

export interface Ok<T> {
  ok: true;
  data: T;
}

export function getLevels(): Ok<{ list: LevelDetail[]; total: number }> {
  return { ok: true, data: { list: LEVELS, total: LEVELS.length } };
}

export function getLevelDetail(id: string): Ok<LevelDetail> | { ok: false; code: number; message: string } {
  const level = getLevel(id);
  return level
    ? { ok: true, data: level }
    : { ok: false, code: 404, message: "关卡不存在" };
}

export function getLeaderboardTop(): Ok<{ list: LeaderboardEntry[]; total: number }> {
  return { ok: true, data: { list: LEADERBOARD, total: LEADERBOARD.length } };
}

export function getGuideContent(slug: string): Ok<Guide> | { ok: false; code: number; message: string } {
  const guide = getGuide(slug);
  return guide ? { ok: true, data: guide } : { ok: false, code: 404, message: "攻略不存在" };
}

// ---------- 分享卡（shareId 编码 score/stars/level，URL 可回解，SSR/ISR 可生成） ----------
function b64encode(s: string): string {
  return btoa(encodeURIComponent(s)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64decode(s: string): string {
  let t = s.replace(/-/g, "+").replace(/_/g, "/");
  while (t.length % 4) t += "=";
  return decodeURIComponent(atob(t));
}

const DEFAULT_NICKNAME = "弹弓小队玩家";

export interface ShareParams {
  levelId: string;
  score: number;
  stars: number;
  nickname?: string;
}

export function encodeShareId(params: ShareParams): string {
  const payload = [params.levelId, String(params.score), String(params.stars), params.nickname ?? DEFAULT_NICKNAME].join("|");
  return `sh_${b64encode(payload)}`;
}

export function decodeShare(shareId: string): ShareInfo | null {
  try {
    if (!shareId.startsWith("sh_")) return null;
    const payload = b64decode(shareId.slice(3));
    const [levelId, scoreRaw, starsRaw, nickname] = payload.split("|");
    if (!levelId) return null;
    const level = getLevel(levelId);
    const score = Number(scoreRaw);
    const stars = Number(starsRaw);
    const date = new Date().toISOString().slice(0, 10);
    return {
      shareId,
      nickname: nickname || DEFAULT_NICKNAME,
      levelId,
      levelName: level?.name ?? "某关",
      score: Number.isFinite(score) ? score : 0,
      stars: Number.isFinite(stars) ? Math.min(3, Math.max(0, stars)) : 0,
      date,
      cover: `${SITE_URL}/images/og/share-1200x630.webp`,
    };
  } catch {
    return null;
  }
}

export function encodeDemoShareId(): string {
  return encodeShareId({ levelId: "lv-06", score: 4820, stars: 3, nickname: "三颗星猎人" });
}