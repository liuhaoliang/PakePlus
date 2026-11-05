import PlayScreen from "@/components/PlayScreen";
import { getAllLevelIds, getLevel } from "@/lib/levels";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

// B 类功能页：预生成 20 关 + daily，未知 id 直接 404，noindex 不进 sitemap
export const dynamicParams = false;

export function generateStaticParams(): { id: string }[] {
  return getAllLevelIds().map((id) => ({ id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const level = getLevel(id);
  return {
    title: level ? `${level.name} · 弹弓小队` : "游戏",
    robots: { index: false, follow: true },
  };
}

export default async function PlayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const level = getLevel(id);
  if (!level) notFound();
  return (
    <div className="shell">
      <PlayScreen level={level} />
    </div>
  );
}