// JSON-LD 结构化数据注入（进 SSR HTML，供 SEO 抓取）。
// 用 dangerouslySetInnerHTML 注入受控 JSON，数据来自前端可信 mock，无外部注入源。

export function JsonLd({ data }: { data: object }) {
  const json = JSON.stringify(data);
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}