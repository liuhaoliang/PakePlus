import LeaderboardPanel from "@/components/LeaderboardPanel";
import { SITE_URL } from "@/lib/constants";
import { LEADERBOARD } from "@/lib/leaderboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "弹弓小队 · 排行榜",
  description: "弹弓小队全球排行榜：按总星排序、分数破平；得分＝摧毁目标＋剩余弹珠奖励。",
  alternates: { canonical: `${SITE_URL}/leaderboard` },
  openGraph: { type: "website", url: `${SITE_URL}/leaderboard`, title: "弹弓小队 · 排行榜" },
};

export default function LeaderboardPage() {
  return (
    <div className="shell">
      <header className="topbar">
        <a className="brand" href="/">
          <img src="/images/global/favicon.png" alt="" width={30} height={30} />
          弹弓小队
        </a>
        <a className="link-btn" href="/levels">
          去挑战 ›
        </a>
      </header>

      <h1 className="h1">全球排行榜</h1>
      <details className="card" style={{ margin: "0 0 16px" }}>
        <summary className="muted" style={{ cursor: "pointer", fontWeight: 700 }}>
          榜单规则
        </summary>
        <p className="muted" style={{ marginBottom: 0 }}>
          总星为主排序，分数为同星破平；得分＝摧毁目标分＋剩余弹珠奖励。前三名金银铜高亮。
        </p>
      </details>

      <LeaderboardPanel />

      <h2 className="h2">公开总榜 Top20</h2>
      <div className="card">
        {LEADERBOARD.map((e) => (
          <div className="rank-row" key={e.rank}>
            <span
              className={`rank-no${e.rank === 1 ? " gold" : e.rank === 2 ? " silver" : e.rank === 3 ? " bronze" : ""}`}
            >
              {e.rank}
            </span>
            <img className="rank-avatar" src={e.avatar} alt="" />
            <span className="rank-name">{e.nickname}</span>
            <span className="muted">
              {e.totalStars} 星 · {e.score.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}