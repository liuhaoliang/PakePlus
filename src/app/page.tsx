import HomeActions from "@/components/HomeActions";
import OpenAlipayButton from "@/components/OpenAlipayButton";
import { SITE_DESC, SITE_NAME, SITE_TAGLINE, SITE_TITLE, SITE_URL, TOTAL_LEVELS, TOTAL_STARS } from "@/lib/constants";
import { LEADERBOARD } from "@/lib/leaderboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "弹弓小队：弹弓物理休闲小游戏",
  description: SITE_DESC,
  alternates: { canonical: `${SITE_URL}/` },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/`,
    title: SITE_TITLE,
    description: SITE_DESC,
    images: [`${SITE_URL}/images/home/hero-16x9.webp`],
  },
};

const VIDEOGAME_LD = {
  "@context": "https://schema.org",
  "@type": "VideoGame",
  name: SITE_NAME,
  description: SITE_DESC,
  genre: ["休闲", "物理", "弹射"],
  playMode: "SinglePlayer",
  gamePlatform: "Web",
  inLanguage: "zh-CN",
  url: SITE_URL,
};

export default function HomePage() {
  const top5 = LEADERBOARD.slice(0, 5);
  return (
    <div className="shell">
      <header className="topbar">
        <span className="brand">
          <img src="/images/global/favicon.png" alt="" width={30} height={30} />
          {SITE_NAME}
        </span>
        <span className="row" style={{ gap: 6 }}>
          <a className="link-btn" href="/guide/slingshot-tips">
            攻略
          </a>
          <OpenAlipayButton />
        </span>
      </header>

      <section className="section" style={{ textAlign: "center" }}>
        <img
          src="/images/home/hero-16x9.webp"
          alt="弹弓与待发弹珠的游戏主视觉"
          width={1600}
          height={900}
          style={{ width: "100%", height: "auto", borderRadius: 16 }}
        />
        <h1 className="tagline-hero">{SITE_TAGLINE}</h1>
        <p className="muted">20 关物理弹弓 · 手机即玩 · 三星全收集</p>
        <HomeActions />
      </section>

      <section className="grid-2" style={{ marginTop: 16 }}>
        <div className="card">
          <div style={{ fontSize: 26 }}>1️⃣</div>
          <strong>拖拽瞄准</strong>
          <p className="muted" style={{ margin: "4px 0 0" }}>
            按住弹珠向后拉，虚线就是弹道。
          </p>
        </div>
        <div className="card">
          <div style={{ fontSize: 26 }}>2️⃣</div>
          <strong>松开发射</strong>
          <p className="muted" style={{ margin: "4px 0 0" }}>
            拉得越远力度越大，一炮拆堡垒。
          </p>
        </div>
        <div className="card">
          <div style={{ fontSize: 26 }}>3️⃣</div>
          <strong>摧毁目标</strong>
          <p className="muted" style={{ margin: "4px 0 0" }}>
            击倒全部软泥怪，省弹珠拿三星。
          </p>
        </div>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <div className="row between">
          <h2 className="h2" style={{ margin: 0 }}>
            关卡进度
          </h2>
          <a className="link-btn" href="/levels">
            全部关卡 ›
          </a>
        </div>
        <p className="muted" style={{ marginTop: 4 }}>
          {TOTAL_LEVELS} 关 × 3 星 = {TOTAL_STARS} 星等你集齐，关卡地图沿麻绳一路进阶。
        </p>
      </section>

      <section style={{ marginTop: 16 }}>
        <h2 className="h2">排行榜预览</h2>
        <div className="card">
          {top5.map((e) => (
            <div className="rank-row" key={e.rank}>
              <span className={`rank-no${e.rank === 1 ? " gold" : e.rank === 2 ? " silver" : e.rank === 3 ? " bronze" : ""}`}>
                {e.rank}
              </span>
              <img className="rank-avatar" src={e.avatar} alt="" />
              <span className="rank-name">{e.nickname}</span>
              <span className="muted">{e.totalStars} 星</span>
            </div>
          ))}
          <a className="btn btn-ghost btn-block btn-sm" href="/leaderboard" style={{ marginTop: 8, textDecoration: "none" }}>
            查看完整榜单
          </a>
        </div>
      </section>

      <section className="card" style={{ marginTop: 16, textAlign: "center" }}>
        <h2 className="h2" style={{ marginTop: 0 }}>
          叫上好友来比一比
        </h2>
        <p className="muted">分享成绩卡，看谁集星更快、分数更高。</p>
        <div className="row" style={{ justifyContent: "center" }}>
          <OpenAlipayButton />
          <a className="btn btn-ghost btn-sm" href="/levels">
            立即开玩
          </a>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(VIDEOGAME_LD) }} />
    </div>
  );
}