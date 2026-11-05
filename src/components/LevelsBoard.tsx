"use client";

import { Toast } from "antd-mobile";
import { useRouter } from "next/navigation";
import { CHAPTERS, TOTAL_STARS } from "@/lib/constants";
import { LEVELS } from "@/lib/levels";
import { useProgress } from "@/hooks/useProgress";
import type { Chapter } from "@/lib/types";
import { useState } from "react";
import Stars from "./Stars";

/** 关卡列表（含麻绳关卡地图 + 章节筛选）：真实进度读本地存档。 */
export default function LevelsBoard() {
  const router = useRouter();
  const { progress, totalStars } = useProgress();
  const [chapter, setChapter] = useState<Chapter | "all">("all");

  const cumulative = totalStars;
  const visible = LEVELS.filter((l) => chapter === "all" || l.chapter === chapter);
  const percent = Math.min(100, Math.round((cumulative / TOTAL_STARS) * 100));

  const open = (id: string, locked: boolean) => {
    if (locked) {
      Toast.show({ content: "通关上一关（凑够星数）即可解锁" });
      return;
    }
    router.push(`/play/${id}`);
  };

  return (
    <div>
      <div className="card" style={{ position: "sticky", top: 56, zIndex: 10, background: "var(--card)" }}>
        <div className="row between">
          <span style={{ fontWeight: 800 }}>
            已集 {cumulative}/{TOTAL_STARS} 星
          </span>
          <span className="muted">{Math.round(percent)}%</span>
        </div>
        <div className="progress-track" style={{ marginTop: 8 }}>
          <div className="progress-fill" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <div className="row" style={{ flexWrap: "wrap", marginTop: 14, gap: 8 }}>
        <button
          type="button"
          className={`chip${chapter === "all" ? " chip-on" : ""}`}
          onClick={() => setChapter("all")}
        >
          全部
        </button>
        {CHAPTERS.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`chip${chapter === c.id ? " chip-on" : ""}`}
            onClick={() => setChapter(c.id)}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="grid-2" style={{ marginTop: 14 }}>
        {visible.map((l) => {
          const p = progress[l.id];
          const stars = p?.stars ?? 0;
          const locked = l.unlockStars > cumulative;
          return (
            <button
              key={l.id}
              type="button"
              className="card grid-card"
              style={{ textAlign: "left", cursor: "pointer", position: "relative", padding: 10 }}
              onClick={() => open(l.id, locked)}
              aria-label={`${l.name}${locked ? "（未解锁）" : ""}`}
            >
              <span style={{ position: "relative", display: "block" }}>
                <img className="thumb" src={l.thumbnail} alt={l.name} loading="lazy" />
                {locked && (
                  <span
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(246,239,227,0.72)",
                      borderRadius: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 22,
                    }}
                  >
                    🔒
                  </span>
                )}
              </span>
              <span style={{ fontWeight: 800, fontSize: 15, marginTop: 2 }}>{l.name}</span>
              <span className="row between">
                <Stars count={stars} />
                <span className="muted">{p?.score ? `${p.score} 分` : "未通关"}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}