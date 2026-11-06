import type { MetadataRoute } from "next";
import { LEVELS } from "@/lib/mock/data";
import { SITE_ORIGIN } from "@/lib/constants";

// sitemap 只收录 A 类页：首页、关卡列表、榜单、攻略、60 个关卡落地页。
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const base: MetadataRoute.Sitemap = [
    { url: `${SITE_ORIGIN}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_ORIGIN}/levels`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_ORIGIN}/leaderboard`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_ORIGIN}/guide`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];
  for (const lv of LEVELS) {
    base.push({
      url: `${SITE_ORIGIN}/level/${lv.id}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }
  return base;
}