"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Tabs, Toast } from "antd-mobile";
import { loadSave, type SaveState } from "@/lib/storage";
import { CHAPTERS, DIFFICULTY_LABEL } from "@/lib/constants";
import { Stars } from "@/components/Stars";
import type { Level } from "@/lib/types";

/** 关卡地图：3 章 Tabs × 60 关网格。SSR 期默认全部可点（供 SEO 抓取 60 条链接），hydrate 后按存档套锁/星级。 */
export function LevelMap({ levels }: { levels: Level[] }) {
  const [save, setSave] = useState<SaveState | null>(null);

  useEffect(() => {
    setSave(loadSave());
  }, []);

  const unlocked = (lv: Level): boolean => {
    if (save === null) return true;
    if (lv.unlockRule === "none") return true;
    return (save.levelStars[String(lv.unlockRule)] ?? 0) > 0;
  };

  const starsOf = (lvId: number): 0 | 1 | 2 | 3 => save?.levelStars[String(lvId)] ?? 0;

  return (
    <Tabs defaultActiveKey="1">
      {CHAPTERS.map((ch) => {
        const list = levels.filter((l) => l.chapter === ch.chapter);
        return (
          <Tabs.Tab title={ch.name} key={String(ch.chapter)}>
            <p style={{ color: "var(--brand-weak)", margin: "4px 0 12px" }}>{ch.tagline}</p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 10,
              }}
            >
              {list.map((lv) => {
                const open = unlocked(lv);
                const stars = starsOf(lv.id);
                const cell = (
                  <div
                    aria-label={`${lv.displayName}${open ? "" : "(未解锁)"}`}
                    style={{
                      position: "relative",
                      aspectRatio: "1 / 1",
                      borderRadius: 12,
                      background: open ? "#fff" : "#EFE7DA",
                      border: `1.5px solid ${open ? "var(--brand-orange)" : "#E0D5C4"}`,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 2,
                      boxShadow: "0 2px 6px rgba(43,35,32,.06)",
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: 18, color: open ? "var(--brand-ink)" : "#B7A98F" }}>
                      {lv.id}
                    </div>
                    <div style={{ fontSize: 11, color: open ? "var(--brand-ink)" : "#B7A98F", lineHeight: 1.1 }}>
                      {/* 金星数 = 已得星数（I2 修复：原按星数切片星字符的写法会 1★ 显示两星、3★ 与 2★ 相同） */}
                      {open ? (stars > 0 ? <Stars count={stars} size={11} /> : lv.name) : "🔒"}
                    </div>
                    {!open && <span className="sr-only">需要先通关第 {String(lv.unlockRule)} 关</span>}
                  </div>
                );
                if (!open) {
                  return (
                    <button
                      key={lv.id}
                      type="button"
                      aria-label={`${lv.displayName}未解锁`}
                      style={{ padding: 0, border: 0, background: "transparent", cursor: "pointer" }}
                      onClick={() => Toast.show({ content: `先通关第 ${String(lv.unlockRule)} 关` })}
                    >
                      <div style={{ width: "100%" }}>{cell}</div>
                    </button>
                  );
                }
                return (
                  <Link key={lv.id} href={`/play/${lv.id}`} aria-label={lv.displayName}>
                    {cell}
                  </Link>
                );
              })}
            </div>
            <p className="sr-only">
              本章共 {list.length} 关。难度：{DIFFICULTY_LABEL[list[0]?.difficulty ?? 1]}。
            </p>
          </Tabs.Tab>
        );
      })}
    </Tabs>
  );
}