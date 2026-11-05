"use client";

import { Dialog } from "antd-mobile";
import { useRouter } from "next/navigation";
import type { GameResult } from "@/game/engine";
import type { LevelDetail } from "@/lib/types";
import { useState } from "react";
import GameCanvas from "./GameCanvas";

function totalMarbles(level: LevelDetail): number {
  return level.marbles.reduce((sum, m) => sum + m.count, 0);
}

/** 游戏页主体（CSR）：顶部菜单 + Canvas 游戏区 + 局内提示。 */
export default function PlayScreen({ level }: { level: LevelDetail }) {
  const router = useRouter();
  const [score, setScore] = useState(0);
  const [remaining, setRemaining] = useState(totalMarbles(level));
  const [round, setRound] = useState(0);
  const [ended, setEnded] = useState(false);

  const restart = () => {
    void Dialog.confirm({
      content: "确定重开本关？当前进度将丢失",
      confirmText: "重开",
      cancelText: "取消",
      onConfirm: () => {
        setEnded(false);
        setScore(0);
        setRemaining(totalMarbles(level));
        setRound((n) => n + 1);
      },
    });
  };

  const handleEnd = (r: GameResult) => {
    if (ended) return;
    setEnded(true);
    router.replace(`/result/${level.id}?score=${r.score}&stars=${r.stars}`);
  };

  return (
    <div className="play-screen">
      <div className="play-hud">
        <div className="row between">
          <button type="button" className="link-btn" onClick={() => router.push("/levels")} aria-label="返回选关">
            ‹ 选关
          </button>
          <span className="muted">{level.name}</span>
          <button type="button" className="link-btn" onClick={restart} aria-label="重开本关">
            重开
          </button>
        </div>
        <div className="row between" style={{ marginTop: 6 }}>
          <span className="chip">得分 {score}</span>
          <span className="chip">弹珠 ×{remaining}</span>
        </div>
      </div>

      <GameCanvas key={round} level={level} onScore={setScore} onRemaining={setRemaining} onEnd={handleEnd} />

      <p className="muted" style={{ textAlign: "center", marginTop: 12 }}>
        拖拽弹珠瞄准，松开发射 · 击倒全部软泥怪即通关
      </p>
    </div>
  );
}