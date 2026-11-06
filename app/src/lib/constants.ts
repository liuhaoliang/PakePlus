// 全站常量：品牌名、占位 canonical 基域名、存档 key、章节、主题色。
// canonical 域名在 G5 发布前替换为真实域名，其余代码不硬编码 URL。

export const SITE_NAME = "弹弹鸟：鸟蛋保卫战";
export const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "https://dandanniao.example.com";
export const SITE_DESCRIPTION =
  "弹弹鸟：鸟蛋保卫战 —— 原创卡通弹弓小鸟小游戏。拉满弹弓、瞄准发射、击倒猪堡、收复鸟蛋。免登录、免费、无需下载。";

export const SAVE_KEY = "dandanniao:save:v1";
export const FAV_KEY = "dandanniao:fav";
export const UID_KEY = "dandanniao:uid";

export const CHAPTERS: { chapter: 1 | 2 | 3; name: string; cover: string; tagline: string }[] = [
  { chapter: 1, name: "小鸟出巢", cover: "/images/chapters/ch-forest.webp", tagline: "初试弹弓，木塔初体验" },
  { chapter: 2, name: "猪堡山", cover: "/images/chapters/ch-hill.webp", tagline: "石堡天险，猪王登场" },
  { chapter: 3, name: "云端天梯", cover: "/images/chapters/ch-cloud.webp", tagline: "云端塔楼，终极试炼" },
];

export const BRAND_ORANGE = "#FF8A00";
export const BRAND_SKY = "#4FB4F0";
export const BRAND_GREEN = "#64C24E";
export const BRAND_YELLOW = "#FFD23E";
export const BRAND_CREAM = "#FFF6E5";
export const BRAND_WOOD = "#8A5A3B";
export const BRAND_DANGER = "#F05B5B";
export const BRAND_INK = "#2B2320";

export const DIFFICULTY_LABEL: Record<1 | 2 | 3, string> = { 1: "★☆☆", 2: "★★☆", 3: "★★★" };

export const PIG_SCORE: Record<"normal" | "king", number> = { normal: 1000, king: 1500 };
export const BLOCK_SCORE: Record<"wood" | "stone" | "glass", number> = { glass: 200, wood: 300, stone: 400 };
export const BIRD_BONUS = 1000;