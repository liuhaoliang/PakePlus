#!/usr/bin/env node
/**
 * check-seo.mjs — 第三方纯 H5「SEO 收录一致性」确定性检查
 * 用法: node check-seo.mjs [项目根]   默认 cwd（找 app/ 或 src/app/）
 * 退出码: 0 通过 / 1 命中须修 / 2 未找到 app 目录(非 Next App Router)
 * 规则源: references/ssr-seo-sharing.md / testing-acceptance.md §3
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const SKIP = new Set(['node_modules', '.next', 'dist', 'build', 'out', '.git', '.turbo']);

function findApp() {
  for (const c of ['app', 'src/app']) {
    const p = path.join(root, c);
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) return p;
  }
  return null;
}
const appDir = findApp();
if (!appDir) { console.error(`未找到 app/ 或 src/app/（非 Next App Router?跳过）: ${root}`); process.exit(2); }

const pages = [];
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP.has(name) || name.startsWith('.')) continue;
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p);
    else if (/^page\.(tsx|ts|jsx|js)$/.test(name)) pages.push(p);
  }
}
walk(appDir);

const hard = [], warn = [];
// 代码锚点检测：避免把正文里描述性的 "canonical/OG" 文字误判为元数据
const reCanonical = /\balternates\b|canonical\s*:/;
const reOG = /\bopenGraph\b/;
const reSEO = /generateMetadata|export\s+const\s+metadata\b|\bMetadata\b|\bopenGraph\b|\balternates\b|canonical\s*:/;
let anyCanonicalPage = false;

for (const pg of pages) {
  const t = fs.readFileSync(pg, 'utf8');
  const c = reCanonical.test(t), g = reOG.test(t);
  if (c) anyCanonicalPage = true;
  const isSEO = reSEO.test(t);
  if (isSEO && c && !g)
    hard.push({ f: pg, m: '设了 canonical(alternates) 但缺 openGraph（canonical==og:url==公网URL 应四处一致）' });
  if (isSEO && g && !c)
    hard.push({ f: pg, m: '设了 openGraph 但缺 canonical(alternates)（同上）' });
  if (/AlipayGuard/.test(t) && !/noindex|index:\s*false/i.test(t))
    warn.push({ f: pg, m: '引入 AlipayGuard(B 类)但未见 noindex — 确认该页 robots: { index: false }' });
  if (/user-agent/i.test(t) && !/container|isAlipayClientSSR/.test(t))
    hard.push({ f: pg, m: 'page 直接判 user-agent 且未走 container.isAlipayClientSSR — 有 cloaking 嫌疑，见 pitfalls.md §4' });
}
if (anyCanonicalPage) {
  const has = (n) => fs.existsSync(path.join(appDir, n));
  const hasSitemap = ['sitemap.ts', 'sitemap.js', 'sitemap.tsx'].some(has);
  const hasRobots = ['robots.ts', 'robots.js', 'robots.tsx'].some(has);
  if (!hasSitemap) hard.push({ f: path.join(appDir, 'sitemap'), m: 'A 类(含 canonical)页存在但缺 app/sitemap.ts（sitemap 只含 A 类，含分页）' });
  if (!hasRobots) hard.push({ f: path.join(appDir, 'robots'), m: 'A 类页存在但缺 app/robots.ts（robots 屏蔽 B 类）' });
}

console.log(`=== 第三方纯 H5 SEO 收录一致性：${root}`);
if (!hard.length && !warn.length) { console.log('✅ 通过：canonical/og 一致、sitemap/robots 在场、无 cloaking 嫌疑。'); process.exit(0); }
if (warn.length) { console.error('\n⚠ 提示(不阻断):'); for (const w of warn) console.error(`  ${path.relative(root, w.f)}\n    ${w.m}\n`); }
if (hard.length) {
  console.error(`\n❌ 命中 ${hard.length} 项须修（见 ssr-seo-sharing.md / testing-acceptance.md §3）:\n`);
  for (const h of hard) console.error(`  ${path.relative(root, h.f)}\n    ${h.m}\n`);
  process.exit(1);
}
console.log('（仅提示项，无须修）'); process.exit(0);
