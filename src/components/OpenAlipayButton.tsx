"use client";

import { openPageInAlipay } from "@/container";
import { useInAlipay } from "@/hooks/useInAlipay";
import { usePathname } from "next/navigation";

/** 浏览器环境显示「打开支付宝」，支付宝内不显示（避免重复入口）。 */
export default function OpenAlipayButton() {
  const inAlipay = useInAlipay();
  const pathname = usePathname();
  if (inAlipay !== false) return null;
  const target = `${window.location.origin}${pathname}`;
  return (
    <button type="button" className="btn btn-ghost btn-sm" onClick={() => openPageInAlipay(target)}>
      打开支付宝
    </button>
  );
}