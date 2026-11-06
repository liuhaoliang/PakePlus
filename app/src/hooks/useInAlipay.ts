"use client";

import { useEffect, useState } from "react";
import { isAlipayClient } from "@/container/container";

/**
 * SSR 期返回 null、挂载后判定，避免「是否在支付宝内」的 UI 闪烁。
 * 仅用于启用支付/授权入口、给浏览器用户做降级展示。
 */
export function useInAlipay(): boolean | null {
  const [inApp, setInApp] = useState<boolean | null>(null);
  useEffect(() => {
    setInApp(isAlipayClient());
  }, []);
  return inApp;
}