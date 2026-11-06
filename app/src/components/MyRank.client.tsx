"use client";

import { useEffect, useState } from "react";
import { loadSave } from "@/lib/storage";
import { AvatarBadge } from "@/components/AvatarBadge";

/** 排行榜「我的排名卡」：SSR 显示未登录降级文案，hydrate 后显示本地战绩提示。 */
export function MyRankCard() {
  const [best, setBest] = useState<number | null>(null);
  const [cleared, setCleared] = useState<number | null>(null);

  useEffect(() => {
    const save = loadSave();
    const vals = Object.values(save.bestScores);
    const stars = Object.values(save.levelStars).filter((s) => (s ?? 0) > 0);
    setBest(vals.length ? Math.max(...vals) : 0);
    setCleared(stars.length);
  }, []);

  return (
    <div className="card" style={{ display: "flex", alignItems: "center", gap: 12, background: "#FFF7E0" }}>
      <AvatarBadge color="#FFD23E" name="我" size={44} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700 }}>{cleared === null ? "登录后上榜,跨端同步" : `我的最佳 ${best} 分 · 通关 ${cleared} 关`}</div>
        <div style={{ fontSize: 13, color: "var(--brand-weak)" }}>本地存档,支付宝一键登录为预留能力</div>
      </div>
    </div>
  );
}