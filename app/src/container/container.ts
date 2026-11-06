// 支付宝第三方纯 H5 —— 容器抽象层。
// 约定见 skill references/container.md：默认 Level 1(标准 Web) + Level 2(开放平台服务端接口/scheme)。
// 不要在此依赖 AlipayJSBridge 的容器 JSAPI（pushWindow/setTitle/setShareContent 第三方均不可用）。

// ---------- env ----------
export function isAlipayClient(): boolean {
  // 仅用于「环境判定」，绝不调用 AlipayJSBridge 的容器 JSAPI。
  if (typeof window !== "undefined" && typeof (window as { AlipayJSBridge?: unknown }).AlipayJSBridge !== "undefined") return true;
  return /AlipayClient|AliApp|Alipay/i.test(typeof navigator !== "undefined" ? navigator.userAgent : "");
}

/**
 * SSR 安全判定（传 request 的 UA）：只用于「是否在支付宝内」的极轻分流（如不预取登录态数据）。
 * ⚠ 反 cloaking：绝不据此给爬虫与用户出不同可见内容/head。
 */
export function isAlipayClientSSR(ua: string | undefined): boolean {
  if (!ua) return false;
  return /AlipayClient|AliApp|Alipay/i.test(ua);
}

// ---------- navigation（第三方无多 webview → 标准多页） ----------
export function openPage(url: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  window.location.assign(appendQuery(url, params));
}

export function goBack(fallback: string): void {
  if (typeof window === "undefined") return;
  if (window.history.length > 1) window.history.back();
  else window.location.assign(fallback);
}

// ---------- 浏览器 → 支付宝唤起 ----------
export function openPageInAlipay(targetUrl?: string): void {
  if (typeof window === "undefined") return;
  const url = targetUrl ?? window.location.href;
  const scheme = `alipays://platformapi/startapp?appId=20000067&url=${encodeURIComponent(url)}`;
  const landing = `https://render.alipay.com/p/s/i/?scheme=${encodeURIComponent(scheme)}`;
  window.location.assign(landing); // 非 alipay.com 域名需在开放平台配置跳转白名单
}

// ---------- 分享（无自定义分享 SDK；外部靠 OG，App 内靠 URL） ----------
export async function shareLink(url: string, text: string): Promise<"shared" | "copied" | "unsupported"> {
  if (typeof window === "undefined") return "unsupported";
  try {
    if (typeof navigator.share === "function") {
      await navigator.share({ title: text, url });
      return "shared";
    }
    await copyText(url);
    return "copied";
  } catch {
    return "copied";
  }
}

export async function copyText(text: string): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
}

// ---------- 跨页/跨次状态（localStorage + storage 事件兜底） ----------
const BUS_KEY = "dandanniao:bus";

export function emitBus(event: string, payload: unknown): void {
  try {
    window.localStorage.setItem(BUS_KEY, JSON.stringify({ event, payload, ts: Date.now() }));
  } catch {
    /* 私有模式/空间不足：以服务端持久化为主 */
  }
}

export function onBus(event: string, handler: (payload: unknown) => void): () => void {
  const fn = (e: StorageEvent) => {
    if (e.key !== BUS_KEY || !e.newValue) return;
    try {
      const m = JSON.parse(e.newValue) as { event?: string; payload?: unknown };
      if (m.event === event) handler(m.payload);
    } catch {
      /* ignore */
    }
  };
  window.addEventListener("storage", fn);
  return () => window.removeEventListener("storage", fn);
}

export function onResume(handler: () => void): () => void {
  const fn = () => {
    if (document.visibilityState === "visible") handler();
  };
  document.addEventListener("visibilitychange", fn);
  return () => document.removeEventListener("visibilitychange", fn);
}

// ---------- helpers ----------
function appendQuery(url: string, p?: Record<string, unknown>): string {
  if (!p || !Object.keys(p).length) return url;
  const qs = new URLSearchParams(p as Record<string, string>).toString();
  return url.includes("?") ? `${url}&${qs}` : `${url}?${qs}`;
}