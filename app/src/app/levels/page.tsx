import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { MyProgress } from "@/components/MyProgress.client";
import { LevelMap } from "@/components/LevelMap.client";
import { LEVELS } from "@/lib/mock/data";
import { SITE_ORIGIN } from "@/lib/constants";

export const metadata: Metadata = {
  title: "关卡地图",
  description: "弹弹鸟：鸟蛋保卫战全部 60 关一览。3 章 × 20 关，逐关解锁，挑战三星。",
  alternates: { canonical: "/levels" },
  openGraph: {
    type: "website",
    url: "/levels",
    title: "关卡地图 - 弹弹鸟：鸟蛋保卫战",
    description: "3 章 × 20 关，60 个弹弓关卡等你挑战。",
    images: [{ url: "/images/chapters/ch-forest.webp", width: 1200, height: 400, alt: "关卡地图" }],
  },
};

export default function LevelsPage() {
  return (
    <div className="page">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "弹弹鸟关卡列表",
          url: `${SITE_ORIGIN}/levels`,
          numberOfItems: LEVELS.length,
          itemListElement: LEVELS.map((lv, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: lv.displayName,
            url: `${SITE_ORIGIN}/level/${lv.id}`,
          })),
        }}
      />

      <header style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0 4px" }}>
        <Link href="/" aria-label="返回首页" style={{ fontSize: 14, color: "var(--brand-weak)", padding: 8 }}>
          ‹ 返回
        </Link>
        <h1 style={{ fontSize: 20 }}>关卡地图</h1>
      </header>

      <p style={{ color: "var(--brand-weak)", margin: "0 0 16px" }}>
        3 章 × 20 关，共 60 关。逐关解锁，击倒猪堡即可过关。
      </p>

      <section className="section" style={{ marginTop: 4 }}>
        <MyProgress />
      </section>

      <section className="section">
        <LevelMap levels={LEVELS} />
      </section>

      <p style={{ marginTop: 24, fontSize: 13, color: "var(--brand-weak)" }}>
        还不会玩？先看 <Link href="/guide" style={{ color: "var(--brand-orange)", fontWeight: 700 }}>玩法攻略</Link>，或去{" "}
        <Link href="/leaderboard" style={{ color: "var(--brand-orange)", fontWeight: 700 }}>排行榜</Link> 看看弹王怎么打。
      </p>
    </div>
  );
}