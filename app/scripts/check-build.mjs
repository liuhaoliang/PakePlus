#!/usr/bin/env node
/**
 * check-build.mjs — 第三方纯 H5 发布前门（secret/产物）确定性检查
 * 用法: node check-build.mjs [项目根]   默认 cwd
 * 退出码: 0 通过 / 1 命中须修
 * 规则源: references/release.md / coding-standards.md（env 边界）/ testing-acceptance.md §5
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const SECRET = /PRIVATE|SECRET|KEY|TOKEN|PASS|MERCHANT/i;
const hard = [], warn = [];

// 1) .env* 里禁止把 secret 以 NEXT_PUBLIC_ 暴露给前端
for (const f of ['.env', '.env.local', '.env.production', '.env.development']) {
  const p = path.join(root, f);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = /^\s*NEXT_PUBLIC_([A-Z0-9_]+)\s*=/.exec(line);
    if (m && SECRET.test(m[1])) hard.push({ f: p, m: `NEXT_PUBLIC_${m[1]} 命中 secret 关键字 — 服务端密钥不得用 NEXT_PUBLIC_（会进前端 bundle），见 coding-standards.md「环境变量边界」` });
  }
}
// 2) app/api 服务端路由引用 process.env.NEXT_PUBLIC_*（服务端不应依赖 public 变量）
function scanApi(dir) {
  if (!fs.existsSync(dir)) return;
  for (const n of fs.readdirSync(dir)) {
    if (n.startsWith('.')) continue;
    const p = path.join(dir, n); if (!fs.existsSync(p)) continue;
    const st = fs.statSync(p);
    if (st.isDirectory()) scanApi(p);
    else if (/\.(ts|tsx|js|jsx)$/.test(n) && /process\.env\.NEXT_PUBLIC_/.test(fs.readFileSync(p, 'utf8')))
      warn.push({ f: p, m: 'app/api 服务端用了 process.env.NEXT_PUBLIC_* — 服务端应直接用非 public 服务端变量' });
  }
}
for (const d of [path.join(root, 'app', 'api'), path.join(root, 'src', 'app', 'api')]) scanApi(d);

// 3) 若 .next 已构建：扫静态产物防私钥类串入 client bundle(best-effort)
const next = path.join(root, '.next');
if (fs.existsSync(next)) {
  const leaks = [];
  (function scan(d) {
    for (const n of fs.readdirSync(d)) {
      const p = path.join(d, n);
      const st = fs.statSync(p);
      if (st.isDirectory() && n !== 'cache') scan(p);
      else if (/\.js$/.test(n) && /-----BEGIN [A-Z]+ PRIVATE KEY-----/.test(fs.readFileSync(p, 'utf8'))) leaks.push(p);
    }
  })(path.join(next, 'static'));
  for (const x of leaks) hard.push({ f: x, m: '构建产物含私钥 PEM 串 — 私钥不得进客户端 bundle，见 release.md「发布前门」' });
}

console.log(`=== 第三方纯 H5 发布前门（secret/产物）：${root}`);
if (!hard.length && !warn.length) { console.log('✅ 通过：env 边界安全、(如已构建)产物无私钥串。'); process.exit(0); }
if (warn.length) { console.error('\n⚠ 提示(不阻断):'); for (const w of warn) console.error(`  ${path.relative(root, w.f)}\n    ${w.m}\n`); }
if (hard.length) {
  console.error(`\n❌ 命中 ${hard.length} 项须修（见 release.md / coding-standards.md）:\n`);
  for (const h of hard) console.error(`  ${path.relative(root, h.f)}\n    ${h.m}\n`);
  process.exit(1);
}
console.log('（仅提示项）'); process.exit(0);
