"use client";

import { SlingshotGame, WORLD_H, WORLD_W, type GameResult } from "@/game/engine";
import type { LevelDetail } from "@/lib/types";
import { useEffect, useRef } from "react";

interface Props {
  level: LevelDetail;
  onScore: (score: number) => void;
  onRemaining: (remaining: number) => void;
  onEnd: (result: GameResult) => void;
}

/** Canvas 宿主：负责 DOM/指针坐标换算，物理与绘制在 SlingshotGame 内。 */
export default function GameCanvas({ level, onScore, onRemaining, onEnd }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cbRef = useRef({ onScore, onRemaining, onEnd });
  cbRef.current = { onScore, onRemaining, onEnd };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const game = new SlingshotGame(canvas, level, {
      onScore: (s) => cbRef.current.onScore(s),
      onRemaining: (r) => cbRef.current.onRemaining(r),
      onStateChange: () => {},
      onEnd: (r) => cbRef.current.onEnd(r),
    });
    game.start();

    const toWorld = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const wx = ((e.clientX - rect.left) / Math.max(1, rect.width)) * WORLD_W;
      const wy = ((e.clientY - rect.top) / Math.max(1, rect.height)) * WORLD_H;
      return { wx, wy };
    };
    const down = (e: PointerEvent) => {
      e.preventDefault();
      const { wx, wy } = toWorld(e);
      game.pointerDown(wx, wy);
    };
    const move = (e: PointerEvent) => {
      const { wx, wy } = toWorld(e);
      game.pointerMove(wx, wy);
    };
    const up = () => game.pointerUp();

    canvas.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      canvas.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      game.destroy();
    };
  }, [level]);

  return (
    <canvas
      ref={canvasRef}
      className="game-canvas"
      role="img"
      aria-label="弹弓游戏区：拖拽弹珠瞄准，松开发射，击倒全部软泥怪"
    />
  );
}