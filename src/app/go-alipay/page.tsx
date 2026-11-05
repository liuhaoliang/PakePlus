import GoAlipayScreen from "@/components/GoAlipayScreen";
import type { Metadata } from "next";

// C 类引导页：浏览器 → 支付宝，noindex
export const metadata: Metadata = {
  title: "打开支付宝 · 弹弓小队",
  robots: { index: false, follow: true },
};

export default function GoAlipayPage() {
  return <GoAlipayScreen />;
}