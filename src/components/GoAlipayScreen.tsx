"use client";

import { openPageInAlipay } from "@/container";
import { useEffect, useState } from "react";

/** C 类引导页：浏览器 → 支付宝（自动 scheme 唤起 + 手动兜底）。 */
export default function GoAlipayScreen() {
  const [target, setTarget] = useState<string>("");

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const raw = sp.get("url") ?? "/";
    const full = raw.startsWith("http") ? raw : `${window.location.origin}${raw}`;
    setTarget(full);
  }, []);

  useEffect(() => {
    if (target) openPageInAlipay(target);
  }, [target]);

  const open = () => {
    openPageInAlipay(target || `${window.location.origin}/`);
  };

  return (
    <div className="shell" style={{ textAlign: "center", paddingTop: 40 }}>
      <img
        src="/images/global/app-icon.png"
        alt="弹弓小队"
        style={{ width: 96, height: 96, margin: "0 auto", borderRadius: 24 }}
      />
      <h1 className="h1" style={{ marginTop: 16 }}>
        正在打开支付宝…
      </h1>
      <p className="muted">若未自动跳转，请点击下方按钮在支付宝中打开本游戏。</p>
      <div className="cta-stack" style={{ maxWidth: 320, margin: "24px auto 0" }}>
        <button type="button" className="btn btn-primary btn-block" onClick={open}>
          打开支付宝
        </button>
        <a className="btn btn-ghost btn-block" href="/">
          返回首页
        </a>
      </div>
    </div>
  );
}