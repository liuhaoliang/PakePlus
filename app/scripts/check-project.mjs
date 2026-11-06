#!/usr/bin/env node
/**
 * check-project.mjs — 支付宝第三方纯 H5 项目护栏确定性检查
 * 扫描项目源码，拦截 skill 明令禁止的私有/容器/小程序 API 调用遗址，输出可验证结果。
 *
 * 用法:
 *   node scripts/check-project.mjs [项目目录]      默认 cwd
 * 退出码: 0 通过 / 1 命中禁止项 / 2 参数错
 * 规则源: references/pitfalls.md 摘（§1/§2/§3/§5）；改ihar 修规则请同步 pitfalls.md。
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
  console.error(`目录不存在: ${root}`);
  process.exit(2);
}

const EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const SKIP_DIRS = new Set(['node_modules', '.next', 'dist', 'build', 'out', '.git', '.turbo', 'coverage', '.cache']);

// 硬禁止：仅匹配「调用形态」，避免注释里出现的名字误报
const RULES = [
  { re: /AlipayJSBridge\s*\.\s*call\s*\(/, why: 'AlipayJSBridge 调用容器 JSAPI（第三方纯 H5 不可调，见 pitfalls §3）' },
  { re: /AlipayJSBridge\s*\.\s*(?:pushWindow|popWindow|setTitle|setShareContent)\s*\(/, why: 'AlipayJSBridge.<容器JSAPI>() 多webview/原生栏/自定义分享（第三方不可用）' },
  { re: /\.\s*call\s*\(\s*['"]pushWindow['"]\s*,/, why: ".call('pushWindow'…) 多 webview（第三方不可用，用 location/历史后退）" },
  { re: /\.\s*call\s*\(\s*['"]popWindow['"]\s*,/, why: ".call('popWindow'…)（无原生 popWindow，用 history.back()）" },
  { re: /\.\s*call\s*\(\s*['"]setTitle['"]\s*,/, why: ".call('setTitle'…) 原生标题栏（第三方不可用，统一 HTML <title>）" },
  { re: /\.\s*call\s*\(\s*['"]setShareContent['"]\s*,/, why: ".call('setShareContent'…) 自定义分享（第三方不可用，用 OG + scheme）" },
  { re: /\bap\.tradePay\s*\(/, why: 'ap.tradePay 调用（公网无第三方 H5 版；支付一律服务端 alipay.trade.wap.pay 跳转）' },
  { re: /\bmy\.tradePay\s*\(/, why: 'my.tradePay 调用（是小程序 API，非 H5）' },
  { re: /(?:\bfrom\s+['"]@alipay\/jssdk['"]|\brequire\s*\(\s*['"]@alipay\/jssdk['"])/, why: 'import/require @alipay/jssdk（npm 实测 404；前端默认无需 SDK，来源以 open/08xgr7 为准）' },
];

const hits = [];

function scan(file) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, i) => {
    for (const r of RULES) {
      if (r.re.test(line)) {
        hits.push({ file: path.relative(root, file), line: i + 1, code: line.trim().slice(0, 160), why: r.why });
      }
    }
  });
}

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP_DIRS.has(name) || name.startsWith('.')) continue;
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p);
    else if (EXT.has(path.extname(name))) scan(p);
  }
}

walk(root);

console.log(`=== 支付宝第三方纯 H5 项目护栏：${root}`);
if (!hits.length) {
  console.log('✅ 通过：未发现禁止的容器/小程序/私有 API 调用遗址。');
  process.exit(0);
}
console.error(`\n❌ 命中 ${hits.length} 项禁止用法（见 references/pitfalls.md）：\n`);
for (const h of hits) {
  console.error(`  ${h.file}:${h.line}`);
  console.error(`    ${h.code}`);
  console.error(`    → ${h.why}\n`);
}
process.exit(1);
