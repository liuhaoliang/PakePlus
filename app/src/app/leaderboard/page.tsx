import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { AvatarBadge } from "@/components/AvatarBadge";
import { MyRankCard } from "@/components/MyRank.client";
import { LEADERBOARD } from "@/lib/mock/data";
import { SITE_ORIGIN } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "排行榜",
  description: "弹弹鸟：鸟蛋保卫战总分排行榜，见证本周弹王。上传你的分数，与好友一较高下。",
  alternates: { canonical: "/leaderboard" },
  openGraph: {
    type: "website",
    url: "/leaderboard",
    title: "排行榜 - 弹弹鸟：鸟蛋保卫战",
    description: "总分榜 Top 22,看看谁是本周弹王。",
    images: [{ url: "/images/ranking/badge-gold.svg", width: 40, height: 40, alt: "排行榜" }],
  },
};

export default function LeaderboardPage() {
  return (
    <div className="page">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "弹弹鸟总分排行榜",
          url: `${SITE_ORIGIN}/leaderboard`,
          numberOfItems: LEADERBOARD.length,
          itemListElement: LEADERBOARD.map((e) => ({
            "@type": "ListItem",
            position: e.rank,
            name: e.nickname,
            url: `${SITE_ORIGIN}/leaderboard#rank-${e.rank}`,
          })),
        }}
      />

      <header style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0 4px" }}>
        <Link href="/" aria-label="返回首页" style={{ fontSize: 14, color: "var(--brand-weak)", padding: 8 }}>
          ‹ 返回
        </Link>
        <h1 style={{ fontSize: 20 }}>排行榜</h1>
      </header>

      <section className="section" style={{ marginTop: 4 }}>
        <MyRankCard />
      </section>

      <section className="section">
        <h2>总分榜</h2>
        <div className="card" style={{ padding: "8px 12px" }}>
          {LEADERBOARD.map((e) => (
            <div
              key={e.uid}
              id={`rank-${e.rank}`}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #f3ead9" }}
            >
              <span
                aria-label={`第 ${e.rank} 名`}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: 13,
                  background: e.rank === 1 ? "#FFD23E" : e.rank === 2 ? "#D7DDE3" : e.rank === 3 ? "#E8B192" : "#F4EEE2",
                  color: e.rank <= 3 ? "#fff" : "var(--brand-weak)",
                }}
              >
                {e.rank}
              </span>
              <AvatarBadge color={e.avatarColor} name={e.nickname} size={36} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{e.nickname}</div>
                <div style={{ fontSize: 12, color: "var(--brand-weak)" }}>通关 {e.cleared} 关</div>
              </div>
              <span style={{ fontWeight: 800, color: "var(--brand-ink)" }}>{e.totalScore.toLocaleString("zh-CN")}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, color: "var(--brand-weak)", marginTop: 8 }}>共 {LEADERBOARD.length} 位玩家入榜。</p>
      </section>

      <p style={{ fontSize: 13, color: "var(--brand-weak)" }}>
        想上榜？去 <Link href="/levels" style={{ color: "var(--brand-orange)", fontWeight: 700 }}>关卡地图</Link> 刷高每一关的分数吧。
      </p>
    </div>
  );
}