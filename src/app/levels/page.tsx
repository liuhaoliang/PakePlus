import LevelsBoard from "@/components/LevelsBoard";
import { SITE_DESC, SITE_URL, TOTAL_LEVELS } from "@/lib/constants";
import { LEVELS } from "@/lib/levels";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "弹弓小队 · 20 个关卡",
  description: `弹弓小队共 ${TOTAL_LEVELS} 关，丛林/沙漠/雪地/城镇四大章节，逐关拆堡垒、集三星。`,
  alternates: { canonical: `${SITE_URL}/levels` },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/levels`,
    title: "弹弓小队 · 20 个关卡",
    description: SITE_DESC,
  },
};

const ITEM_LIST_LD = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "弹弓小队关卡列表",
  numberOfItems: LEVELS.length,
  itemListElement: LEVELS.map((l, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: l.name,
    url: `${SITE_URL}/play/${l.id}`,
  })),
};

export default function LevelsPage() {
  return (
    <div className="shell">
      <header className="topbar">
        <a className="brand" href="/">
          <img src="/images/global/favicon.png" alt="" width={30} height={30} />
          弹弓小队
        </a>
        <a className="link-btn" href="/">
          返回首页
        </a>
      </header>

      <h1 className="h1">关卡地图</h1>
      <p className="muted">沿麻绳路径从丛林一路打到市政厅，共 {TOTAL_LEVELS} 关；每日挑战即时刷新。</p>

      <LevelsBoard />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ITEM_LIST_LD) }} />
    </div>
  );
}