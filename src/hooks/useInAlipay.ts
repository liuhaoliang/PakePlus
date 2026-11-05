"use client";

import { isAlipayClient } from "@/container";
import { useEffect, useState } from "react";

/** SSR 期返回 null，挂载后判定，防首屏闪烁/水合不一致。 */
export function useInAlipay(): boolean | null {
  const [inAlipay, setInAlipay] = useState<boolean | null>(null);
  useEffect(() => {
    setInAlipay(isAlipayClient());
  }, []);
  return inAlipay;
}