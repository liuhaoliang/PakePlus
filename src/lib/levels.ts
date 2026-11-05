// 《弹弓小队》—— 20 关内容与局内布局（确定性生成，玩家真实进度在 localStorage、与 mock 分离）
import { CHAPTER_NAME } from "./constants";
import type { BlockKind, Chapter, LevelDetail, MarbleType, ObstacleDef, TargetDef } from "./types";

const CHAPTER_ORDER: Chapter[] = ["jungle", "desert", "snow", "town"];

const LEVEL_NAMES: string[] = [
  "第一关 · 丛林清晨",
  "第二关 · 藤蔓密林",
  "第三关 · 吊桥险路",
  "第四关 · 古树之巅",
  "第五关 · 丛林大本营",
  "第六关 · 沙漠驿站",
  "第七关 · 流沙陷阱",
  "第八关 · 仙人掌谷",
  "第九关 · 金字塔谜题",
  "第十关 · 沙暴要塞",
  "第十一关 · 雪原初临",
  "第十二关 · 冰湖碎裂",
  "第十三关 · 松林木屋",
  "第十四关 · 雪崩隘口",
  "第十五关 · 冰川城堡",
  "第十六关 · 小镇屋顶",
  "第十七关 · 谷仓围困",
  "第十八关 · 集市闹市",
  "第十九关 · 高塔危楼",
  "第二十关 · 市政厅总攻",
];

// 示例存档（公开展示用）
const EXAMPLE_STARS: Record<string, number> = { "lv-01": 3, "lv-06": 2, "lv-11": 1 };
const EXAMPLE_BEST: Record<string, number> = { "lv-01": 5120, "lv-06": 4820, "lv-11": 2360 };

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** 每关可发射弹珠（难度递增，后期引入雷电/冰弹珠） */
function marblesFor(i: number): { type: MarbleType; count: number }[] {
  if (i < 5) return [{ type: "fire", count: 3 }];
  if (i < 10) return [{ type: "fire", count: 2 }, { type: "thunder", count: 1 }];
  if (i < 15) return [{ type: "fire", count: 2 }, { type: "ice", count: 1 }];
  return [{ type: "fire", count: 2 }, { type: "thunder", count: 1 }, { type: "ice", count: 1 }];
}

function targetCount(i: number): number {
  return Math.min(9, 2 + Math.floor((i + 1) / 2));
}

// ---------- 确定性伪随机（保证每关布局可复现、无网络依赖） ----------
function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(rng: () => number, pool: BlockKind[]): BlockKind {
  return pool[Math.floor(rng() * pool.length)] ?? "wood";
}

// 世界坐标系：1280×720；地面 y=660；发射台在左侧 (~170, 560)；堡垒在右侧 780~1190
const GROUND = 660;

interface Layout {
  obstacles: ObstacleDef[];
  targetDefs: TargetDef[];
}

function buildLayout(index: number, chapterIndex: number, targetTotal: number): Layout {
  const rng = mulberry32(index * 2654435761 + 1013904223);
  const obstacles: ObstacleDef[] = [];
  const targetDefs: TargetDef[] = [];

  const pool: BlockKind[] =
    chapterIndex === 0
      ? ["wood", "wood", "glass"]
      : chapterIndex === 1
        ? ["wood", "glass", "stone"]
        : chapterIndex === 2
          ? ["glass", "glass", "stone"]
          : ["stone", "stone", "iron", "wood"];

  const diff = (index % 5) + 1; // 章内难度 1..5
  const pillarCount = 2 + Math.min(2, Math.floor((diff + 1) / 2)); // 2..4 根柱
  const startX = 790;
  const span = 380;

  const xs: number[] = [];
  for (let n = 0; n < pillarCount; n++) {
    const base = pillarCount > 1 ? startX + (span * n) / (pillarCount - 1) : 920;
    xs.push(base + (rng() * 30 - 15));
  }

  // 每个柱子的叠箱高度随章/难度递增
  const heights = xs.map((_, n) => 2 + chapterIndex + Math.floor(diff / 3) + (n % 2));

  for (let n = 0; n < pillarCount; n++) {
    const x = xs[n] ?? 920;
    const h = heights[n] ?? 2;

    // 竖柱（从地面往上叠 box）
    for (let k = 0; k < h; k++) {
      const boxH = 34;
      const y = GROUND - 17 - k * 38;
      obstacles.push({ kind: pick(rng, pool), shape: "box", x, y, w: 34, h: boxH });
    }

    // 柱顶放软泥怪
    const pillarTopY = GROUND - 17 - h * 38 - 17;
    if (targetDefs.length < targetTotal) {
      targetDefs.push({ x, y: pillarTopY - 16 - 6, r: 16 });
    }

    // 相邻柱之间搭木桥 + 桥上软泥怪
    if (n < pillarCount - 1) {
      const x2 = xs[n + 1] ?? 1200;
      const cx = (x + x2) / 2;
      const cw = Math.abs(x2 - x) + 10;
      const plankPrayY = GROUND - 14 - h * 38;
      obstacles.push({ kind: "wood", shape: "plank", x: cx, y: plankPrayY, w: cw, h: 14 });
      if (targetDefs.length < targetTotal) {
        targetDefs.push({ x: cx + (rng() * 48 - 24), y: plankPrayY - 7 - 16 - 6, r: 16 });
      }
    }
  }

  // 兜底：地面软泥怪
  while (targetDefs.length < targetTotal) {
    targetDefs.push({ x: 800 + rng() * 360, y: GROUND - 16 - 6, r: 16 });
  }

  return { obstacles, targetDefs: targetDefs.slice(0, targetTotal) };
}

// ---------- 关卡列表（构建期静态生成） ----------
function buildLevels(): LevelDetail[] {
  const levels: LevelDetail[] = [];
  for (let i = 0; i < LEVEL_NAMES.length; i++) {
    const chapterIndex = Math.floor(i / 5);
    const chapter: Chapter = CHAPTER_ORDER[chapterIndex] ?? "jungle";
    const id = `lv-${pad(i + 1)}`;
    const name = LEVEL_NAMES[i] ?? `第 ${i + 1} 关`;
    const layout = buildLayout(i, chapterIndex, targetCount(i));
    const unlockStars = i === 0 ? 0 : 3 * i;
    const stars = EXAMPLE_STARS[id] ?? 0;
    const bestScore = EXAMPLE_BEST[id] ?? 0;
    levels.push({
      id,
      name,
      chapter,
      chapterName: CHAPTER_NAME[chapter],
      theme: chapter,
      thumbnail: `/images/levels/${chapter}-${pad((i % 5) + 1)}.webp`,
      marbles: marblesFor(i),
      targets: targetCount(i),
      unlockStars,
      stars,
      bestScore,
      locked: false, // 公开 mock 展示用；真实锁定由客户端进度计算
      isDaily: false,
      autoSave: true,
      obstacles: layout.obstacles,
      targetDefs: layout.targetDefs,
    });
  }
  return levels;
}

export const LEVELS: LevelDetail[] = buildLevels();

export const DAILY_LEVEL: LevelDetail = {
  id: "daily",
  name: "今日挑战 · 沙暴要塞",
  chapter: "desert",
  chapterName: "沙漠",
  theme: "desert",
  thumbnail: "/images/levels/desert-05.webp",
  marbles: [{ type: "fire", count: 2 }, { type: "thunder", count: 1 }],
  targets: 5,
  unlockStars: 0,
  stars: 0,
  bestScore: 0,
  locked: false,
  isDaily: true,
  autoSave: false,
  obstacles: buildLayout(99, 1, 5).obstacles,
  targetDefs: buildLayout(99, 1, 5).targetDefs,
};

export function getLevel(id: string): LevelDetail | undefined {
  if (id === "daily") return DAILY_LEVEL;
  return LEVELS.find((l) => l.id === id);
}

export function getAllLevelIds(): string[] {
  return [...LEVELS.map((l) => l.id), "daily"];
}