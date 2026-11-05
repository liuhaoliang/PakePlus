import ShareActions from "@/components/ShareActions";
import Stars from "@/components/Stars";
import { decodeShare, encodeDemoShareId } from "@/lib/api";
import { SITE_URL } from "@/lib/constants";
import { getLevel } from "@/lib/levels";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

// SSG + ISR：预生成演示分享卡，新 shareId 按需生成并缓存
export const revalidate = 300;
export const dynamicParams = true;

export function generateStaticParams(): { shareId: string }[] {
  return [{ shareId: encodeDemoShareId() }];
}

export async function generateMetadata({ params }: { params: Promise<{ shareId: string }> }): Promise<Metadata> {
  const { shareId } = await params;
  const info = decodeShare(shareId);
  if (!info) return { robots: { index: false } };
  const url = `${SITE_URL}/share/${info.shareId}`;
  const title = `${info.nickname}在弹弓小队拿下 ${info.score} 分 · ${info.levelName}`;
  const desc = `${info.stars} 星通关，快来挑战我！`;
  return {
    title,
    description: desc,
    alternates: { canonical: url },
    openGraph: { type: "website", url, title, description: desc, images: [info.cover] },
  };
}

export default async function SharePage({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;
  const info = decodeShare(shareId);
  if (!info) notFound();

  const related = getLevel(info.levelId)
    ? [getLevel(info.levelId)!]
    : [];
  const others = ["lv-01", "lv-06"].map(getLevel).filter((l): l is NonNullable<typeof l> => Boolean(l));

  return (
    <div className="shell">
      <header className="topbar">
        <a className="brand" href="/">
          <img src="/images/global/favicon.png" alt="" width={30} height={30} />
          弹弓小队
        </a>
      </header>

      <div className="card" style={{ textAlign: "center", padding: "28px 16px" }}>
        <img
          src="/images/og/share-1200x630.webp"
          alt="成绩分享卡"
          style={{ width: "100%", borderRadius: 12, aspectRatio: "1200/630", objectFit: "cover" }}
        />
        <h1 className="h1" style={{ fontSize: 24 }}>
          @{info.nickname}
        </h1>
        <div className="tagline-hero">
          {info.score} 分 <Stars count={info.stars} />
        </div>
        <p className="muted">
          {info.levelName} · {info.date}
        </p>
      </div>

      <ShareActions levelId={info.levelId} />

      <section style={{ marginTop: 24 }}>
        <h2 className="h2">相关关卡</h2>
        <div className="grid-2">
          {[...related, ...others].slice(0, 3).map((l) => (
            <a key={l.id} className="card grid-card" href={`/play/${l.id}`}>
              <img className="thumb" src={l.thumbnail} alt={l.name} loading="lazy" />
              <span style={{ fontWeight: 800, fontSize: 15 }}>{l.name}</span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}