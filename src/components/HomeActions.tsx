"use client";

import { useProgress } from "@/hooks/useProgress";
import { LEVELS } from "@/lib/levels";
import { useRouter } from "next/navigation";

/** 首页 CTA：游客本机进度驱动「开始 / 继续第 N 关」。 */
export default function HomeActions() {
  const router = useRouter();
  const { progress } = useProgress();

  let continueId: string | null = null;
  for (const l of LEVELS) {
    const p = progress[l.id];
    if (!p || !p.cleared) {
      continueId = l.id;
      break;
    }
  }
  if (continueId === null) continueId = LEVELS[0]?.id ?? null;
  const firstId = LEVELS[0]?.id ?? "lv-01";
  const label = continueId === firstId ? "开始游戏" : `继续 ${continueId}`;

  return (
    <div className="row" style={{ justifyContent: "center", gap: 12 }}>
      <button type="button" className="btn btn-primary" onClick={() => continueId && router.push(`/play/${continueId}`)}>
        {label}
      </button>
      <button type="button" className="btn btn-ghost" onClick={() => router.push("/levels")}>
        选关
      </button>
    </div>
  );
}