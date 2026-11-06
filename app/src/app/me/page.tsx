import type { Metadata } from "next";
import { AlipayGuard } from "@/components/AlipayGuard";
import { MeClient } from "@/components/Me.client";

// B 类功能页：CSR + noindex。个人数据不收录。
export const metadata: Metadata = {
  title: "我的战绩",
  robots: { index: false, follow: false },
};

export default function MePage() {
  return (
    <AlipayGuard>
      <MeClient />
    </AlipayGuard>
  );
}