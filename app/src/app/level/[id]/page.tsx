import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { AvatarBadge } from "@/components/AvatarBadge";
import { getLevel, getLevelLeaderboard, LEVELS } from "@/lib/mock/data";
import { SITE_NAME, SITE_ORIGIN, DIFFICULTY_LABEL } from "@/lib/constants";

export const revalidate = 3600;

export function generateStaticParams() {
  return LEVELS.map((lv) => ({ id: String(lv.id) }));
}

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const level = getLevel(Number(params.id));
  if (!level) return { title: "关卡不存在" };
  const cover = `/images/chapters/ch-${["forest", "hill", "cloud"][level.chapter - 1]}.webp`;
  const ogTitle = `我第 ${level.id} 关拿了高分，敢来挑战吗？${SITE_NAME}`;
  return {
    title: level.displayName,
    description: `${level.displayName}，难度${DIFFICULTY_LABEL[level.difficulty]}，最高分 ${level.starScore[1].toLocaleString("zh-CN")}。拉满弹弓，击倒猪堡的全部小猪即可过关。`,
    alternates: { canonical: `/level/${level.id}` },
    openGraph: {
      type: "article",
      url: `/level/${level.id}`,
      title: ogTitle,
      description: `拉满弹弓，击倒猪堡。${level.displayName}，来和我一决高下。`,
      images: [{ url: cover, width: 1200, height: 400, alt: level.displayName }],
    },
  };
}

export default function LevelDetailPage({ params }: { params: { id: string } }) {
  const level = getLevel(Number(params.id));
  if (!level) notFound();

  const board = getLevelLeaderboard(level.id);
  const cover = `/images/chapters/ch-${["forest", "hill", "cloud"][level.chapter - 1]}.webp`;

  return (
    <div className="page">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "VideoGame",
          name: level.displayName,
          url: `${SITE_ORIGIN}/level/${level.id}`,
          inLanguage: "zh-CN",
          gamePlatform: ["Web browser", "Alipay WebView"],
          playMode: "SinglePlayer",
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "首页", item: `${SITE_ORIGIN}/` },
            { "@type": "ListItem", position: 2, name: "关卡地图", item: `${SITE_ORIGIN}/levels` },
            { "@type": "ListItem", position: 3, name: level.displayName, item: `${SITE_ORIGIN}/level/${level.id}` },
          ],
        }}
      />

      <header style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0" }}>
        <Link href="/levels" aria-label="返回关卡列表" style={{ fontSize: 14, color: "var(--brand-weak)", padding: 8 }}>
          ‹ 返回
        </Link>
      </header>

      <section className="card" style={{ overflow: "hidden", padding: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cover} alt={level.displayName} style={{ width: "100%", height: "auto", display: "block" }} />
        <div style={{ padding: 16 }}>
          <h1 style={{ fontSize: 22 }}>{level.displayName}</h1>
          <p style={{ color: "var(--brand-weak)", margin: "4px 0" }}>
            难度 {DIFFICULTY_LABEL[level.difficulty]} · 过关 {level.targetScore.toLocaleString("zh-CN")} 分 · 最高{" "}
            {level.starScore[1].toLocaleString("zh-CN")} 分
          </p>
          <p style={{ marginTop: 12, lineHeight: 1.7 }}>拉满弹弓，击倒猪堡的全部小猪即可过关。剩余小鸟越多、拆解结构越巧妙，星级越高。</p>
          <p style={{ marginTop: 12, padding: "10px 12px", background: "#FFF7E0", borderRadius: 10, fontSize: 14 }}>💡 {level.tip}</p>
        </div>
      </section>

      <section className="section">
        <h2>本关排行榜</h2>
        <div className="card" style={{ padding: "8px 12px" }}>
          {board.slice(0, 10).map((e) => (
            <div key={e.uid} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f3ead9" }}>
              <span style={{ width: 24, textAlign: "center", fontWeight: 800, color: e.rank <= 3 ? "var(--brand-orange)" : "var(--brand-weak)" }}>{e.rank}</span>
              <AvatarBadge color={e.avatarColor} name={e.nickname} size={34} />
              <span style={{ flex: 1 }}>{e.nickname}</span>
              <span style={{ fontWeight: 700 }}>{(e.maxLevelScore ?? 0).toLocaleString("zh-CN")}</span>
            </div>
          ))}
        </div>
      </section>

      <section style={{ display: "flex", gap: 12 }}>
        <Link href={`/play/${level.id}`} className="btn btn-primary" style={{ flex: 1 }}>
          开始挑战
        </Link>
        <Link href="/levels" className="btn btn-ghost">
          返回关卡列表
        </Link>
      </section>
    </div>
  );
}