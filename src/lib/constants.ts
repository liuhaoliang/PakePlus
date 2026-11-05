import type { BlockKind, Chapter, MarbleType } from "./types";

export const SITE_NAME = "弹弓小队";
export const SITE_TITLE = "弹弓小队｜弹弓物理休闲小游戏";
export const SITE_TAGLINE = "拖一拖，拉一拉，把堡垒一炮打趴！";
export const SITE_DESC = "20 关物理弹弓休闲小游戏，手机即玩、三星全收集，随时打发时间。";
export const KEYWORDS = "弹弓物理游戏、休闲小游戏、打发时间小游戏";

/** 站点公网地址：canonical/og:url/sitemap 的 host（仅 NEXT_PUBLIC_ 可见配置） */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://slingshot.example.com";

export const TOTAL_LEVELS = 20;
export const STARS_PER_LEVEL = 3;
export const TOTAL_STARS = TOTAL_LEVELS * STARS_PER_LEVEL;

export const OG_DEFAULT = `${SITE_URL}/images/og/og-default-1200x630.webp`;
export const OG_SHARE = `${SITE_URL}/images/og/share-1200x630.webp`;

export interface ChapterMeta {
  id: Chapter;
  name: string;
  color: string;
  icon: string;
}

export const CHAPTERS: ChapterMeta[] = [
  { id: "jungle", name: "丛林", color: "#2E9E5B", icon: "/images/levels/chapter-jungle.svg" },
  { id: "desert", name: "沙漠", color: "#E9A23B", icon: "/images/levels/chapter-desert.svg" },
  { id: "snow", name: "雪地", color: "#3D9BE9", icon: "/images/levels/chapter-snow.svg" },
  { id: "town", name: "城镇", color: "#C77B4A", icon: "/images/levels/chapter-town.svg" },
];

export const CHAPTER_NAME: Record<Chapter, string> = {
  jungle: "丛林",
  desert: "沙漠",
  snow: "雪地",
  town: "城镇",
};

export const MARBLE_LABEL: Record<MarbleType, string> = {
  fire: "阿火",
  ice: "阿冰",
  thunder: "阿雷",
};

export const MARBLE_COLOR: Record<MarbleType, string> = {
  fire: "#FF5A36",
  ice: "#3D9BE9",
  thunder: "#F7B733",
};

export const SLIME_COLOR = "#7FD65A";
export const BLOCK_COLOR: Record<BlockKind, string> = {
  wood: "#C98A5B",
  glass: "#9BD8E8",
  stone: "#8B8D94",
  iron: "#5B6472",
};

/** 视觉 Token（antd-mobile CSS 变量同名，供 globals.css 使用） */
export const THEME_TOKENS = {
  primary: "#FF5A36",
  success: "#2E9E5B",
  warning: "#F7B733",
  danger: "#E5484D",
  text: "#2B2A28",
  textSecondary: "#6E6A62",
  weak: "#A8A29A",
  border: "#E3DBCB",
  background: "#F6EFE3",
};