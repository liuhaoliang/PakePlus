import { SITE_URL } from "@/lib/constants";
import { getGuide } from "@/lib/guide";
import { encodeDemoShareId } from "@/lib/api";
import type { MetadataRoute } from "next";

/** 仅 A 类可收录 URL；B/C 类（/play、/result、/go-alipay）不进 sitemap。 */
export default function sitemap(): MetadataRoute.Sitemap {
  const guides = (getGuide("slingshot-tips") ? ["slingshot-tips"] : []).map((slug) => ({
    url: `${SITE_URL}/guide/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [
    { url: `${SITE_URL}/`, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: `${SITE_URL}/levels`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/leaderboard`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/share/${encodeDemoShareId()}`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.5 },
    ...guides,
  ];
}