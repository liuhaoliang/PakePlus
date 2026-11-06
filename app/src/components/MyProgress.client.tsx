"use client";

import { useEffect, useState } from "react";
import { loadSave } from "@/lib/storage";

/** 我的进度概览（SSR 出「60 关等你挑战」，hydrate 后按本地存档显示通关数/总星）。 */
export function MyProgress() {
  const [text, setText] = useState<string>("60 关等你挑战");
  const [pct, setPct] = useState<number>(0);

  useEffect(() => {
    const save = loadSave();
    const entries = Object.entries(save.levelStars).filter(([, s]) => (s ?? 0) > 0);
    const cleared = entries.length;
    const totalStars = entries.reduce((acc, [, s]) => acc + (s ?? 0), 0);
    setText(cleared > 0 ? `已通关 ${cleared}/60 · 总星 ${totalStars}/180` : "60 关等你挑战");
    setPct(Math.round((cleared / 60) * 100));
  }, []);

  return (
    <div className="card" style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700 }}>{text}</div>
        <div style={{ marginTop: 8, height: 8, borderRadius: 999, background: "#eee", overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: "var(--brand-orange)", borderRadius: 999, transition: "width .3s" }} />
        </div>
      </div>
    </div>
  );
}