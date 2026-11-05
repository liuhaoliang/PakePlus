import { SITE_URL } from "@/lib/constants";
import { getGuide, GUIDES } from "@/lib/guide";
import { getLevel } from "@/lib/levels";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export function generateStaticParams(): { slug: string }[] {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return {};
  const url = `${SITE_URL}/guide/${guide.slug}`;
  return {
    title: `${guide.title} · 弹弓小队`,
    description: guide.abstract,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: `${guide.title} · 弹弓小队`,
      description: guide.abstract,
      images: [`${SITE_URL}${guide.cover}`],
    },
  };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  const ARTICLE_LD = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.abstract,
    image: `${SITE_URL}${guide.cover}`,
    datePublished: guide.date,
    inLanguage: "zh-CN",
  };

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

      <article>
        <h1 className="h1">{guide.title}</h1>
        <p className="muted">
          {guide.date} · {guide.abstract}
        </p>
        <img src={guide.cover} alt={guide.title} style={{ width: "100%", borderRadius: 16, margin: "12px 0" }} />

        {guide.sections.map((s, i) => (
          <section key={i} style={{ marginTop: 20 }}>
            <h2 className="h2">{s.heading}</h2>
            <p>{s.body}</p>
            <img src={s.image} alt={s.heading} loading="lazy" style={{ width: "100%", borderRadius: 12, marginTop: 8 }} />
          </section>
        ))}
      </article>

      <section style={{ marginTop: 24 }}>
        <h2 className="h2">适合练手的关卡</h2>
        <div className="grid-2">
          {guide.relatedLevels.map((id) => {
            const l = getLevel(id);
            if (!l) return null;
            return (
              <a key={id} className="card grid-card" href={`/play/${id}`}>
                <img className="thumb" src={l.thumbnail} alt={l.name} loading="lazy" />
                <span style={{ fontWeight: 800, fontSize: 15 }}>{l.name}</span>
              </a>
            );
          })}
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_LD) }} />
    </div>
  );
}