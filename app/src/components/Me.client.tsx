"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Dialog, Empty, Switch, Toast } from "antd-mobile";
import { AvatarBadge } from "@/components/AvatarBadge";
import { clearSave, loadSave, type SaveState } from "@/lib/storage";
import { LEVELS } from "@/lib/mock/data";

function fmtTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("zh-CN", { hour12: false });
  } catch {
    return iso;
  }
}

/** 我的战绩（B，登录态/游客态）：进度概览 + 星级明细 + 历史记录 + 设置。 */
export function MeClient() {
  const [save, setSave] = useState<SaveState | null>(null);
  const [sound, setSound] = useState(true);

  useEffect(() => {
    setSave(loadSave());
  }, []);

  const cleared = save ? Object.values(save.levelStars).filter((s) => (s ?? 0) > 0).length : 0;
  const totalStars = save ? Object.values(save.levelStars).reduce<number>((a, s) => a + (s ?? 0), 0) : 0;
  const bestTotal = save ? Math.max(0, ...Object.values(save.bestScores)) : 0;

  return (
    <div className="page">
      <header style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0 4px" }}>
        <Link href="/" aria-label="返回首页" style={{ fontSize: 14, color: "var(--brand-weak)", padding: 8 }}>
          ‹ 返回
        </Link>
        <h1 style={{ fontSize: 20 }}>我的战绩</h1>
      </header>

      <section className="card" style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <AvatarBadge color="#FFD23E" name="我" size={56} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>{save?.uid?.replace("u_guest_", "游客 ") ?? "游客"}</div>
          <div style={{ fontSize: 12, color: "var(--brand-weak)" }}>本地存档 · 支付宝一键登录为预留能力</div>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <Stat n={cleared} label="通关" />
          <Stat n={totalStars} label="总星" />
          <Stat n={bestTotal.toLocaleString("zh-CN")} label="最高分" />
        </div>
      </section>

      <section className="section">
        <h2>关卡星级</h2>
        <div className="card">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
            {LEVELS.map((lv) => {
              const stars = save?.levelStars[String(lv.id)] ?? 0;
              return (
                <Link
                  key={lv.id}
                  href={`/level/${lv.id}`}
                  aria-label={`第 ${lv.id} 关 ${stars} 星`}
                  style={{
                    aspectRatio: "1/1",
                    borderRadius: 10,
                    border: "1.5px solid " + (stars > 0 ? "var(--brand-orange)" : "#E0D5C4"),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontWeight: 700,
                    color: stars > 0 ? "var(--brand-ink)" : "#C5B69E",
                  }}
                >
                  {stars > 0 ? "★".repeat(stars) : lv.id}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section">
        <h2>最近记录</h2>
        <div className="card">
          {!save || save.recent.length === 0 ? (
            <Empty description="你的战绩会出现在这里" style={{ padding: "20px 0" }} />
          ) : (
            save.recent.map((r, i) => {
              const lv = LEVELS.find((l) => l.id === r.levelId);
              return (
                <div key={`${r.levelId}-${r.playedAt}-${i}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f3ead9" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{lv ? lv.displayName : `第 ${r.levelId} 关`}</div>
                    <div style={{ fontSize: 12, color: "var(--brand-weak)" }}>{fmtTime(r.playedAt)}</div>
                  </div>
                  <span style={{ color: "#FFB400" }}>{"★".repeat(r.stars)}</span>
                  <span style={{ fontWeight: 700 }}>{r.score.toLocaleString("zh-CN")}</span>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="section">
        <h2>设置</h2>
        <div className="card" style={{ padding: "8px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0" }}>
            <span>音效</span>
            <Switch
              checked={sound}
              onChange={(v) => {
                setSound(v);
                Toast.show({ content: v ? "音效已开启(预留)" : "音效已关闭" });
              }}
            />
          </div>
          <div
            style={{ padding: "8px 0", color: "var(--brand-danger)" }}
            role="button"
            tabIndex={0}
            onClick={() => {
              Dialog.confirm({
                content: "确定清除本地存档吗？星级与历史将全部清空。",
                onConfirm: () => {
                  clearSave();
                  setSave(loadSave());
                  Toast.show({ content: "本地存档已清除" });
                },
              });
            }}
          >
            清除本地存档
          </div>
        </div>
      </section>

      <footer style={{ marginTop: 24, fontSize: 12, color: "var(--brand-weak)", lineHeight: 1.8 }}>
        <p style={{ margin: 0 }}>本作为原创卡通弹弓小鸟（弹弹鸟），与 Rovio《愤怒的小鸟》无关联。</p>
      </footer>
    </div>
  );
}

function Stat({ n, label }: { n: number | string; label: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontWeight: 800, fontSize: 18 }}>{n}</div>
      <div style={{ fontSize: 12, color: "var(--brand-weak)" }}>{label}</div>
    </div>
  );
}