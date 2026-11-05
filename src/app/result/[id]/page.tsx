import ResultScreen from "@/components/ResultScreen";
import { getAllLevelIds } from "@/lib/levels";
import type { Metadata } from "next";

// B 类功能页：noindex；本局数据由客户端 query 透传（直开回退默认态）
export const dynamicParams = false;

export function generateStaticParams(): { id: string }[] {
  return getAllLevelIds().map((id) => ({ id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  await params;
  return { title: "结算 · 弹弓小队", robots: { index: false, follow: true } };
}

export default async function ResultPage() {
  return (
    <div className="shell">
      <ResultScreen />
    </div>
  );
}