import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlipayGuard } from "@/components/AlipayGuard";
import { PlayClient } from "@/game/PlayClient";
import { getLevel, nextLevelId } from "@/lib/mock/data";

// B 类功能页：CSR + noindex。浏览器打开由 AlipayGuard 出「请在支付宝中打开」降级屏。
export const metadata: Metadata = {
  title: "游戏",
  robots: { index: false, follow: false },
};

export default function PlayPage({ params }: { params: { id: string } }) {
  const level = getLevel(Number(params.id));
  if (!level) notFound();
  return (
    <AlipayGuard>
      <PlayClient level={level} nextId={nextLevelId(level.id)} />
    </AlipayGuard>
  );
}