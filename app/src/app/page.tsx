import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { JsonLd } from "@/components/JsonLd";
import { AvatarBadge } from "@/components/AvatarBadge";
import { Stars } from "@/components/Stars";
import { ResumeCta } from "@/components/ResumeCta.client";
import { ShareFavActions } from "@/components/ShareFav.client";
import { MyProgress } from "@/components/MyProgress.client";
import { LEADERBOARD, getLevel } from "@/lib/mock/data";
import { SITE_DESCRIPTION, SITE_NAME, SITE_ORIGIN, DIFFICULTY_LABEL } from "@/lib/constants";

export const metadata: Metadata = {
  title: `${SITE_NAME} —— 拉满弹弓，守护最后一颗蛋`,
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    title: `${SITE_NAME} —— 拉满弹弓，守护最后一颗蛋`,
    description: SITE_DESCRIPTION,
    images: [{ url: "/images/home/hero.webp", width: 1200, height: 630, alt: SITE_NAME }],
  },
};

const FEATURED_IDS = [1, 7, 14, 21, 35, 52];
const STEPS = [
  { img: "/images/home/step-aim.svg", title: "瞄准", body: "拖动小鸟，拉满皮筋" },
  { img: "/images/home/step-launch.svg", title: "松手", body: "瞄准就绪，松手发射" },
  { img: "/images/home/step-crush.svg", title: "摧毁", body: "击倒猪堡，收复鸟蛋" },
];

export default function HomePage() {
  const featured = FEATURED_IDS.map((id) => getLevel(id)).filter((l): l is NonNullable<typeof l> => Boolean(l));
  return (
    <div className="page">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "VideoGame",
          name: SITE_NAME,
          genre: ["Puzzle", "Casual"],
          operatingSystem: "Web",
          gamePlatform: ["Web browser", "Alipay WebView"],
          description: SITE_DESCRIPTION,
          url: `${SITE_ORIGIN}/`,
          inLanguage: "zh-CN",
        }}
      />

      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0 16px" }}>
        <span style={{ fontWeight: 800, fontSize: 20, color: "var(--brand-orange)" }}>🐤 弹弹鸟</span>
        <Link href="/me" style={{ fontSize: 14, color: "var(--brand-weak)", padding: 8 }}>
          我的战绩 ›
        </Link>
      </header>

      <section className="brand-gradient" style={{ borderRadius: 20, padding: "20px 18px", textAlign: "center" }}>
        <Image src="/images/home/hero.webp" alt={`${SITE_NAME} 主视觉插画`} width={1200} height={630} priority style={{ width: "100%", height: "auto", borderRadius: 14 }} />
        <h1 style={{ fontSize: 26, marginTop: 16 }}>弹弹鸟·鸟蛋保卫战</h1>
        <p style={{ color: "var(--brand-weak)", margin: "4px 0 20px" }}>拉满弹弓，守护最后一颗蛋</p>
        <ResumeCta />
        <p style={{ fontSize: 12, color: "var(--brand-weak)", marginTop: 12 }}>免登录 · 免费 · 无需下载</p>
      </section>

      <section className="section">
        <MyProgress />
      </section>

      <section className="section">
        <h2>三步玩法</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {STEPS.map((s) => (
            <div key={s.title} className="card" style={{ textAlign: "center" }}>
              <Image src={s.img} alt={s.title} width={96} height={96} style={{ width: 56, height: 56 }} />
              <div style={{ fontWeight: 700, marginTop: 8 }}>{s.title}</div>
              <div style={{ fontSize: 12, color: "var(--brand-weak)" }}>{s.body}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>关卡精选</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
          {featured.map((lv) => (
            <Link key={lv.id} href={`/level/${lv.id}`} className="card" style={{ display: "block", padding: 10 }}>
              <Image
                src={`/images/levels/card-${((lv.id - 1) % 6) + 1}.webp`}
                alt={lv.displayName}
                width={640}
                height={360}
                style={{ width: "100%", height: "auto", borderRadius: 10 }}
              />
              <div style={{ fontWeight: 700, marginTop: 8, fontSize: 14 }}>{lv.displayName}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                <Stars count={2} size={14} />
                <span style={{ fontSize: 12, color: "var(--brand-weak)" }}>{DIFFICULTY_LABEL[lv.difficulty]}</span>
              </div>
            </Link>
          ))}
        </div>
        <p style={{ textAlign: "right", marginTop: 12 }}>
          <Link href="/levels" style={{ color: "var(--brand-orange)", fontWeight: 700 }}>
            查看全部 60 关 →
          </Link>
        </p>
      </section>

      <section className="section">
        <h2>本周弹王 Top 10</h2>
        <div className="card" style={{ padding: "8px 12px" }}>
          {LEADERBOARD.slice(0, 10).map((e) => (
            <div key={e.uid} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f3ead9" }}>
              <span style={{ width: 24, textAlign: "center", fontWeight: 800, color: e.rank <= 3 ? "var(--brand-orange)" : "var(--brand-weak)" }}>{e.rank}</span>
              <AvatarBadge color={e.avatarColor} name={e.nickname} size={34} />
              <span style={{ flex: 1 }}>{e.nickname}</span>
              <span style={{ fontWeight: 700 }}>{e.totalScore.toLocaleString("zh-CN")}</span>
            </div>
          ))}
        </div>
        <p style={{ textAlign: "right", marginTop: 12 }}>
          <Link href="/leaderboard" style={{ color: "var(--brand-orange)", fontWeight: 700 }}>
            查看完整榜单 →
          </Link>
        </p>
      </section>

      <section className="section">
        <ShareFavActions url={`${SITE_ORIGIN}/`} />
      </section>

      <footer style={{ marginTop: 32, padding: "16px 0", borderTop: "1px solid #eadfca", fontSize: 12, color: "var(--brand-weak)", lineHeight: 1.8 }}>
        <p style={{ margin: 0 }}>本作为原创卡通弹弓小鸟（弹弹鸟），与 Rovio《愤怒的小鸟》无关联。</p>
        <p style={{ margin: 0 }}>© {new Date().getFullYear()} {SITE_NAME} · 隐私政策 · 用户协议</p>
      </footer>
    </div>
  );
}