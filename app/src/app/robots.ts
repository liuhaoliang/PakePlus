import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: "*", disallow: ["/play", "/me"] },
    ],
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
  };
}