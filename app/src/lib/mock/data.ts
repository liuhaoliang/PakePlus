// 全站前端 mock 数据源（SSR/CSR 同源）：
// 60 关关卡、22 条总分榜、单关榜、攻略文章、FAQ、好友榜占位。
// 关卡布局由确定性伪随机生成，模块加载一次得到稳定实例，保证 SSG/SSR 与 Route Handler 拿到同一份数据。

import type {
  BlockBody,
  BlockMaterial,
  FaqItem,
  GuideArticle,
  LeaderboardEntry,
  Level,
  LevelLayout,
  PigBody,
  PigTier,
} from "../types";
import { CHAPTERS } from "../constants";

// ---------- 确定性伪随机（mulberry32） ----------
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next() {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- 关卡名（3 章 × 20 关） ----------
const NAMES: string[][] = [
  [
    "破壳首飞", "木塔初试", "弹弓热身", "双柱之间", "屋顶小猪", "石阶小巢", "木塔危楼", "玻璃脆响",
    "双猪并立", "高台守望", "木石交错", "斜塔惊魂", "玻璃塔顶", "环抱小猪", "三段木桥", "石堡初现",
    "空中楼阁", "纵深猪堡", "木箱谜题", "出巢试炼",
  ],
  [
    "双塔守望", "石桥天险", "玻璃城门", "猪王登场", "木石城堡", "悬空猪台", "三角碉堡", "长桥漫漫",
    "双层猪堡", "石柱林立", "斜向堡垒", "玻璃罩猪", "高塔四层", "双子猪王", "木箱长城", "空中走廊",
    "石塔危坠", "猪王宝座", "城墙攻坚", "山顶总攻",
  ],
  [
    "云端初绽", "天空木栈", "玻璃浮台", "双王把守", "石云堡垒", "天梯九阶", "木云吊桥", "玻璃天穹",
    "三猪拱月", "云上石塔", "星辉木塔", "云端猪王", "天空之城", "天险双塔", "玻璃巨龙", "石云锁关",
    "云巅高卢", "终极木塔", "星河猪堡", "保卫鸟蛋",
  ],
];

const WORLD = { groundY: 560, slingshotX: 120, slingshotY: 470 };

// ---------- 结构拼接（坐标系：x 向右、y 向下，世界 1000×650） ----------
interface Piece {
  blocks: BlockBody[];
  pigs: PigBody[];
}

function placeBlock(blocks: BlockBody[], x: number, y: number, w: number, h: number, material: BlockMaterial, angle = 0): void {
  blocks.push({ x, y, w, h, material, angle });
}

/** 单塔：底部平台 + 两根立柱 + 顶梁，猪站在塔内平台上 */
function singleTower(cx: number, material: BlockMaterial, pigTier: PigTier, baseW: number, pigR: number, level: number): Piece {
  const g = WORLD.groundY;
  const blocks: BlockBody[] = [];
  const pigs: PigBody[] = [];
  const floorHalf = baseW / 2;
  placeBlock(blocks, cx, g - 9, baseW, 18, material); // 平台
  placeBlock(blocks, cx - floorHalf + 9, g - 9 - 32, 18, 64, material); // 左柱
  placeBlock(blocks, cx + floorHalf - 9, g - 9 - 32, 18, 64, material); // 右柱
  placeBlock(blocks, cx, g - 9 - 64 - 8, baseW, 16, material); // 顶梁
  if (level >= 2) placeBlock(blocks, cx, g - 9 - 64 - 30, baseW * 0.6, 44, material === "glass" ? "wood" : material);
  pigs.push({ x: cx, y: g - 22 - pigR, r: pigR, hp: pigTier === "king" ? 2 : 1, tier: pigTier });
  return { blocks, pigs };
}

/** 双塔：左右两座塔，中间可能再放一只猪 */
function twinTower(rng: () => number, material: BlockMaterial, ruler: PigTier): Piece {
  const g = WORLD.groundY;
  const blocks: BlockBody[] = [];
  const pigs: PigBody[] = [];
  const cxL = 280 + Math.floor(rng() * 40);
  const cxR = 420 + Math.floor(rng() * 40);
  for (const [cx, t] of [
    [cxL, "normal"] as [number, PigTier],
    [cxR, ruler] as [number, PigTier],
  ]) {
    const p = singleTower(cx, material, t, 120, 22, 2);
    blocks.push(...p.blocks);
    pigs.push(...p.pigs);
  }
  placeBlock(blocks, (cxL + cxR) / 2, g - 9 - 80, Math.abs(cxR - cxL) - 40, 14, material === "stone" ? "wood" : material);
  return { blocks, pigs };
}

/** 桥：一块横板搭在两摞块上，猪在桥下 */
function bridge(rng: () => number, material: BlockMaterial, pigR: number): Piece {
  const g = WORLD.groundY;
  const blocks: BlockBody[] = [];
  const pigs: PigBody[] = [];
  const cx = 360 + Math.floor(rng() * 40);
  const span = 200;
  const pierH = 60;
  placeBlock(blocks, cx - span / 2, g - pierH / 2, 20, pierH, material === "glass" ? "wood" : material);
  placeBlock(blocks, cx + span / 2, g - pierH / 2, 20, pierH, material === "glass" ? "wood" : material);
  placeBlock(blocks, cx, g - pierH - 8, span + 20, 16, material);
  pigs.push({ x: cx, y: g - 22 - pigR, r: pigR, hp: 1, tier: "normal" });
  return { blocks, pigs };
}

/** 玻璃塔：玻璃块托猪，易碎 */
function glassTower(rng: () => number): Piece {
  const g = WORLD.groundY;
  const blocks: BlockBody[] = [];
  const pigs: PigBody[] = [];
  const cx = 330 + Math.floor(rng() * 60);
  placeBlock(blocks, cx, g - 9, 120, 18, "wood");
  placeBlock(blocks, cx - 42, g - 30, 86, 42, "glass");
  placeBlock(blocks, cx + 30, g - 60, 60, 44, "glass");
  pigs.push({ x: cx - 42, y: g - 63 + 12, r: 20, hp: 1, tier: "normal" });
  pigs.push({ x: cx + 30, y: g - 93 + 30, r: 22, hp: 1, tier: "normal" });
  return { blocks, pigs };
}

/** 猪王石堡：石块护住猪王 */
function stoneFort(rng: () => number): Piece {
  const g = WORLD.groundY;
  const blocks: BlockBody[] = [];
  const pigs: PigBody[] = [];
  const cx = 380 + Math.floor(rng() * 40);
  placeBlock(blocks, cx, g - 10, 180, 20, "stone");
  placeBlock(blocks, cx - 70, g - 52, 22, 88, "stone");
  placeBlock(blocks, cx + 70, g - 52, 22, 88, "stone");
  placeBlock(blocks, cx, g - 96, 180, 18, "stone");
  pigs.push({ x: cx, y: g - 26, r: 26, hp: 3, tier: "king" });
  return { blocks, pigs };
}

function buildLayout(id: number, chapter: 1 | 2 | 3, rng: () => number): LevelLayout {
  const g = WORLD.groundY;
  const kinds = ["single", "twin", "bridge", "glass", "fort"] as const;
  const kind = kinds[(id - 1) % kinds.length]!;
  let piece: Piece;
  switch (kind) {
    case "twin":
      piece = twinTower(rng, "wood", chapter >= 2 ? "king" : "normal");
      break;
    case "bridge":
      piece = bridge(rng, chapter >= 3 ? "glass" : "wood", chapter >= 3 ? 24 : 22);
      break;
    case "glass":
      piece = glassTower(rng);
      break;
    case "fort":
      piece = stoneFort(rng);
      break;
    default:
      piece = singleTower(340 + Math.floor(rng() * 60), chapter >= 2 ? "stone" : "wood", "normal", 130, 22, 2);
  }
  // 高难的关在结构外多放一头小猪（考验弧线）
  if (chapter >= 2 && id % 3 === 0) {
    piece.pigs.push({ x: 560, y: g - 22, r: 22, hp: 1, tier: "normal" });
  }
  return {
    slingshot: { x: WORLD.slingshotX, y: WORLD.slingshotY },
    groundY: g,
    pigs: piece.pigs,
    blocks: piece.blocks,
  };
}

function birdsFor(id: number, chapter: 1 | 2 | 3) {
  if (chapter === 1) return id <= 6 ? (["red", "red", "red"] as const) : (["red", "yellow", "red"] as const);
  if (chapter === 2) return id <= 34 ? (["red", "yellow", "red"] as const) : (["red", "red", "yellow", "blue"] as const);
  return id <= 54 ? (["red", "yellow", "blue"] as const) : (["red", "yellow", "yellow", "blue"] as const);
}

function difficultyFor(pos: number): 1 | 2 | 3 {
  if (pos <= 6) return 1;
  if (pos <= 14) return 2;
  return 3;
}

function tipFor(chapter: 1 | 2 | 3, id: number): string {
  if (id === 1) return "先拖到虚线末端松手，瞄向最上方横梁，让木塔整体倒向小猪。";
  if (id === 7) return "黄鸟飞行途中再点一下会加速，适合击穿玻璃层后砸到后排猪。";
  if (id === 21) return "两座塔中间横梁是突破口，先断梁再逐个击破。";
  const pool: Record<1 | 2 | 3, string[]> = {
    1: ["对准立柱底部，塌一座塔就能连带压到第二只猪。", "拉满弹弓打顶梁，落石会帮你清场。", "先用一发清掉玻璃层，再直捣黄龙。"],
    2: ["先拆猪王身边的石柱，再补一发收尾。", "石堡要打角，斜向冲击更容易崩。", "横梁掉落也能压猪，别浪费每一发。"],
    3: ["云上结构高，压线高抛更稳。", "玻璃天穹很脆，用黄鸟加速穿透。", "三只猪分在两塔，优先打连接横梁。"],
  };
  const a = pool[chapter]!;
  return a[id % a.length]!;
}

export const LEVELS: Level[] = (function buildLevels(): Level[] {
  const out: Level[] = [];
  for (let id = 1; id <= 60; id++) {
    const chapter = (id <= 20 ? 1 : id <= 40 ? 2 : 3) as 1 | 2 | 3;
    const chapterInfo = CHAPTERS[chapter - 1]!;
    const pos = ((id - 1) % 20) + 1;
    const rng = mulberry32(id * 2654435761);
    const difficulty = difficultyFor(pos);
    const targetScore = 4000 + id * 160 + difficulty * 1000;
    const starScore: [number, number] = [
      Math.round((targetScore * 1.6) / 100) * 100,
      Math.round((targetScore * 2.4) / 100) * 100,
    ];
    const name = NAMES[chapter - 1]![pos - 1] ?? `第 ${id} 关`;
    out.push({
      id,
      chapter,
      chapterName: chapterInfo.name,
      name,
      displayName: `第 ${chapter} 章·${chapterInfo.name} 第 ${pos} 关`,
      difficulty,
      targetScore,
      starScore,
      availableBirds: [...birdsFor(id, chapter)],
      tip: tipFor(chapter, id),
      unlockRule: id === 1 ? "none" : id - 1,
      layout: buildLayout(id, chapter, rng),
    });
  }
  return out;
})();

export function getLevel(id: number): Level | undefined {
  return LEVELS.find((l) => l.id === id);
}

export function getLevelsByChapter(chapter: 1 | 2 | 3): Level[] {
  return LEVELS.filter((l) => l.chapter === chapter);
}

/** 下一关（非节末则 +1；60 关封顶） */
export function nextLevelId(id: number): number {
  return Math.min(id + 1, 60);
}

// ---------- 排行榜（22 条总分锚定，另按关卡派生单关榜） ----------
const TOTAL_BOARD: Omit<LeaderboardEntry, "rank">[] = [
  { uid: "u_007", nickname: "弹弹侠007", avatarColor: "#FF8A00", totalScore: 128540, cleared: 60 },
  { uid: "u_088", nickname: "酥酥不吃猪", avatarColor: "#4FB4F0", totalScore: 126120, cleared: 59 },
  { uid: "u_102", nickname: "蛋壳保卫队", avatarColor: "#64C24E", totalScore: 124880, cleared: 58 },
  { uid: "u_034", nickname: "拖把喵酱", avatarColor: "#F05B5B", totalScore: 118300, cleared: 55 },
  { uid: "u_201", nickname: "一棵松树", avatarColor: "#8A5A3B", totalScore: 112760, cleared: 53 },
  { uid: "u_056", nickname: "鸟蛋拆迁办", avatarColor: "#FFD23E", totalScore: 110210, cleared: 52 },
  { uid: "u_110", nickname: "小鹿撞撞", avatarColor: "#9C6ADE", totalScore: 105900, cleared: 50 },
  { uid: "u_077", nickname: "核桃侠", avatarColor: "#654321", totalScore: 101470, cleared: 49 },
  { uid: "u_093", nickname: "蹦蹦兔酱", avatarColor: "#7EC8E3", totalScore: 98320, cleared: 47 },
  { uid: "u_041", nickname: "燕麦小饼干", avatarColor: "#E5989B", totalScore: 95140, cleared: 45 },
  { uid: "u_120", nickname: "芝士就是力量", avatarColor: "#F4A261", totalScore: 92080, cleared: 44 },
  { uid: "u_033", nickname: "日落飞行家", avatarColor: "#E76F51", totalScore: 88660, cleared: 42 },
  { uid: "u_065", nickname: "果仁队长", avatarColor: "#6D597A", totalScore: 85730, cleared: 41 },
  { uid: "u_150", nickname: "猫头鹰不睡", avatarColor: "#2A9D8F", totalScore: 82540, cleared: 39 },
  { uid: "u_019", nickname: "弹弓手杰克", avatarColor: "#264653", totalScore: 79300, cleared: 38 },
  { uid: "u_211", nickname: "洋葱圈圈", avatarColor: "#B8A1D9", totalScore: 75890, cleared: 36 },
  { uid: "u_027", nickname: "第59颗蛋", avatarColor: "#D4A373", totalScore: 73120, cleared: 35 },
  { uid: "u_133", nickname: "打工人也要玩", avatarColor: "#3A86FF", totalScore: 70540, cleared: 33 },
  { uid: "u_088b", nickname: "番茄炒鸡蛋花", avatarColor: "#E63946", totalScore: 67300, cleared: 32 },
  { uid: "u_166", nickname: "气泡水冒泡", avatarColor: "#00B4D8", totalScore: 64110, cleared: 30 },
  { uid: "u_177", nickname: "森林小骑士", avatarColor: "#588157", totalScore: 61020, cleared: 29 },
  { uid: "u_199", nickname: "星星掉进碗里", avatarColor: "#7B2CBF", totalScore: 57880, cleared: 27 },
];

export const LEADERBOARD: LeaderboardEntry[] = TOTAL_BOARD.map((e, i) => ({ ...e, rank: i + 1 }));

/** 单关榜：由总分榜派生（乘以与关卡 id 相关的系数，保证稳定且每条可展示） */
export function getLevelLeaderboard(levelId: number): LeaderboardEntry[] {
  const lv = getLevel(levelId);
  const base = lv ? Math.round(lv.starScore[1] * 0.82) : 9000;
  return TOTAL_BOARD.slice(0, 20).map((e, i) => ({
    rank: i + 1,
    uid: e.uid,
    nickname: e.nickname,
    avatarColor: e.avatarColor,
    totalScore: e.totalScore,
    cleared: e.cleared,
    maxLevelScore: Math.max(base - i * 37, base - 700),
    levelId,
  }));
}

export function paginate<T>(list: T[], page: number, pageSize: number): { items: T[]; page: number; pageSize: number; total: number; hasMore: boolean } {
  const start = (page - 1) * pageSize;
  const items = list.slice(start, start + pageSize);
  return { items, page, pageSize, total: list.length, hasMore: start + pageSize < list.length };
}

// ---------- 攻略文章 ----------
export const GUIDES: GuideArticle[] = [
  {
    slug: "three-star",
    title: "三星通关通用法则",
    summary: "星级不是靠运气，而是靠「少用鸟 + 精准落点 + 借力倒塌」。",
    sections: [
      { heading: "阈值怎么算", body: "每一关的过关分与 2/3 星阈值都写在关卡页。剩余小鸟每只额外 +1000 分，猪王 1500 分、普通猪 1000 分、结构块按材质 200~400 分。" },
      { heading: "核心思路", body: "先观察结构承重点：打立柱底部「以一换多」通常比直射头猪更赚。留到最后的鸟越多，星越高。" },
    ],
  },
  {
    slug: "angle",
    title: "弹弓角度与力度控制",
    summary: "高抛压顶、低抛穿缝，力度决定一切。",
    sections: [
      { heading: "高抛", body: "把小鸟拖得更高、更靠后，落点更陡，适合砸顶梁让整塔崩塌。" },
      { heading: "低抛", body: "小幅后拉，弹道平直，适合从两根立柱之间穿过、直取后排猪。" },
    ],
  },
  {
    slug: "birds",
    title: "三种小鸟怎么用",
    summary: "红鸟稳、黄鸟快、蓝鸟重——各有妙用。",
    sections: [
      { heading: "小红（标准）", body: "均衡的初始选择，适合拆木塔与石块。" },
      { heading: "小黄（加速）", body: "飞行途中再点一下屏幕，会向前加速冲刺，适合击穿玻璃层。" },
      { heading: "小蓝（重型，预留）", body: "更重、冲击更大，适合后期厚重的石堡；分裂能力本期预留。" },
    ],
  },
  {
    slug: "combo",
    title: "借力倒塌与连锁反应",
    summary: "一条横梁倒下，能带走下面一整排猪。",
    sections: [
      { heading: "断梁", body: "优先打断连接两塔的横梁，断裂的木板本身也会对下方的猪造成伤害。" },
      { heading: "落石", body: "石块落下也会压死猪。打掉石块上方的支撑，让重力帮你清场。" },
    ],
  },
];

export const FAQ: FaqItem[] = [
  { question: "怎么拿三星？", answer: "三星 = 少用鸟、精准落点、借力倒塌。剩余小鸟每只 +1000 分，详见「三星通关通用法则」。" },
  { question: "黄鸟和蓝鸟怎么用？", answer: "黄鸟飞行途中再点一下会加速；蓝鸟更重、冲击力更大（分裂能力本期预留）。" },
  { question: "断网能玩吗？", answer: "能。游戏核心是单机 Canvas 物理，不依赖网络；只有榜单/攻略等周边页面需要联网。" },
  { question: "怎么登录同步？", answer: "本期以本地存档为主，支付宝一键登录（OAuth）为预留能力，上线后用于跨端同步进度与上榜。" },
  { question: "收费吗？", answer: "免费。复活/道具等内购为预留能力，本期点击会提示「即将上线」。" },
  { question: "和《愤怒的小鸟》有关系吗？", answer: "没有。本作是原创卡通弹弓小鸟（弹弹鸟），形象与素材均为原创，与 Rovio 及其商标无关联。" },
];