// 支付宝第三方纯 H5 —— 容器抽象层
// 约定：默认 Level 1（标准 Web）+ Level 2（开放平台服务端接口 / scheme）。
// 不要在此依赖 AlipayJSBridge.pushWindow/setTitle/setShareContent（第三方不可用）。
// 不依赖 my.*、多 WebView、离线包、私有 RPC。

// ---------- env ----------
export function isAlipayClient(): boolean {
  if (typeof window !== "undefined" && typeof (window as { AlipayJSBridge?: unknown }).AlipayJSBridge !== "undefined") {
    return true;
  }
  return /AlipayClient|AliApp|Alipay/i.test(typeof navigator !== "undefined" ? navigator.userAgent : "");
}

/**
 * SSR 安全判定（传 request 的 UA）：仅用于「是否预取登录态数据」等极轻分流。
 * ⚠ 反 cloaking：绝不要据此给爬虫与用户出不同可见内容/head。
 */
export function isAlipayClientSSR(ua: string | undefined): boolean {
  if (!ua) return false;
  return /AlipayClient|AliApp|Alipay/i.test(ua);
}

// ---------- navigation（第三方无多 WebView -> 标准多页） ----------
function appendQuery(url: string, params?: Record<string, unknown>): string {
  if (!params || Object.keys(params).length === 0) return url;
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) usp.set(k, String(v));
  }
  const qs = usp.toString();
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}${qs}`;
}

/** 进入下一页：整页加载（标准多页，非 SPA 多屏）。 */
export function openPage(url: string, params?: Record<string, unknown>): void {
  window.location.assign(appendQuery(url, params));
}

/** 返回上一页：标准历史后退；无可退时回首页。 */
export function popWindow(): void {
  if (window.history.length <= 1) window.location.assign("/");
  else window.history.back();
}

/** 浏览器环境引导「在支付宝中打开」（landing scheme）。非 alipay.com 域名需配白名单。 */
export function openPageInAlipay(targetUrl: string): void {
  const scheme = `alipays://platformapi/startapp?appId=20000067&url=${encodeURIComponent(targetUrl)}`;
  const landing = `https://render.alipay.com/p/s/i/?scheme=${encodeURIComponent(scheme)}`;
  window.location.assign(landing);
}

// ---------- pay / auth（服务端建 URL，前端只跳转） ----------
/** 手机网站支付：服务端已生成 wap.pay 支付 URL，前端跳转即可（无需前端 SDK）。 */
export function startPay(payServerUrl: string): void {
  window.location.assign(payServerUrl);
}

/** OAuth 授权：服务端已生成 publicAppAuthorize 授权 URL，前端跳转；回调页用 code 换 uid。 */
export function redirectToAuth(authServerUrl: string): void {
  window.location.assign(authServerUrl);
}

/** 复制文本（App 内分享用「复制链接」，无 setShareContent）。 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    return true;
  } catch {
    return false;
  }
}