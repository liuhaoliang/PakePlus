import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { GUIDES, FAQ } from "@/lib/mock/data";
import { SITE_ORIGIN } from "@/lib/constants";
import { FaqAccordion } from "@/components/Faq.client";

export const metadata: Metadata = {
  title: "玩法攻略",
  description: "弹弹鸟：鸟蛋保卫战玩法攻略 —— 三星通用法则、弹弓角度与力度控制、三种小鸟用法、借力倒塌连锁反应与常见问题。",
  alternates: { canonical: "/guide" },
  openGraph: {
    type: "article",
    url: "/guide",
    title: "玩法攻略 - 弹弹鸟：鸟蛋保卫战",
    description: "三星通关法则、弹弓角度控制、小鸟用法与常见问题一文看懂。",
    images: [{ url: "/images/levels/card-5.webp", width: 640, height: 360, alt: "玩法攻略" }],
  },
};

export default function GuidePage() {
  return (
    <div className="page">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ.map((f) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: { "@type": "Answer", text: f.answer },
          })),
        }}
      />

      <header style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0 4px" }}>
        <Link href="/" aria-label="返回首页" style={{ fontSize: 14, color: "var(--brand-weak)", padding: 8 }}>
          ‹ 返回
        </Link>
        <h1 style={{ fontSize: 20 }}>玩法攻略</h1>
      </header>

      <section className="section">
        <p style={{ lineHeight: 1.7, color: "var(--brand-ink)" }}>
          拉满弹弓 → 瞄准 → 松手发射 → 击倒猪堡。目标是用尽可能少的小鸟清空全场小猪：剩余小鸟越多、结构拆解越巧妙，得分与星级越高。
        </p>
      </section>

      <section className="section">
        <h2>技巧文章</h2>
        {GUIDES.map((g, i) => (
          <article key={g.slug} className="card" style={{ marginBottom: 16 }}>
            <JsonLd
              data={{
                "@context": "https://schema.org",
                "@type": "Article",
                headline: g.title,
                description: g.summary,
                url: `${SITE_ORIGIN}/guide#${g.slug}`,
                inLanguage: "zh-CN",
              }}
            />
            <h3 id={g.slug} style={{ fontSize: 18 }}>
              {i + 1}. {g.title}
            </h3>
            <p style={{ color: "var(--brand-weak)", margin: "4px 0 12px" }}>{g.summary}</p>
            {g.sections.map((s) => (
              <div key={s.heading} style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{s.heading}</div>
                <p style={{ margin: 0, lineHeight: 1.7 }}>{s.body}</p>
              </div>
            ))}
          </article>
        ))}
      </section>

      <section className="section">
        <h2>常见问题</h2>
        <FaqAccordion items={FAQ} />
      </section>

      <section className="section" style={{ textAlign: "center", marginTop: 32 }}>
        <Link href="/play/1" className="btn btn-primary">
          去试试第 1 关
        </Link>
      </section>
    </div>
  );
}