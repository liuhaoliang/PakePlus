"use client";

import { useEffect, useState } from "react";
import { isAlipayClient, openPageInAlipay } from "@/container/container";

/**
 * B 类功能页（/play、/me）的浏览器降级屏：
 * 非支付宝环境不渲染业务内容，显示「请在支付宝中打开」+ 唤起按钮。
 * SSR 期返回 null（避免闪屏），挂载后判定。
 */
export function AlipayGuard({ children }: { children: React.ReactNode }) {
  const [inApp, setInApp] = useState<boolean | null>(null);

  useEffect(() => {
    setInApp(isAlipayClient());
  }, []);

  if (inApp === null) {
    return (
      <div className="page" role="status" aria-live="polite">
        <div className="card" style={{ textAlign: "center", padding: "48px 16px" }}>
          正在进入…
        </div>
      </div>
    );
  }

  if (!inApp) {
    return (
      <div className="page">
        <div className="card" style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🐤</div>
          <h1 style={{ fontSize: 20 }}>请在支付宝中打开</h1>
          <p style={{ color: "var(--brand-weak)", marginBottom: 24 }}>
            本页面为支付宝内互动页面，在浏览器中无法完整体验。
          </p>
          <button className="btn btn-primary" type="button" onClick={() => openPageInAlipay()}>
            用支付宝打开
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}