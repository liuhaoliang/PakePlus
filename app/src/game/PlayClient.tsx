"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Toast } from "antd-mobile";
import { GameEngine, WORLD_W, WORLD_H, GRAVITY, MAX_DRAG, LAUNCH_POWER, type GameResult } from "@/game/engine";
import { recordScore } from "@/lib/storage";
import { nextLevelId } from "@/lib/mock/data";
import { SITE_ORIGIN } from "@/lib/constants";
import { copyText } from "@/container/container";
import type { Level } from "@/lib/types";

const BIRD_COLOR: Record<string, string> = { red: "#F05B5B", yellow: "#FFD23E", blue: "#4FB4F0" };
const MATERIAL_FILL: Record<string, string> = { wood: "#C8945A", stone: "#B9B7AD", glass: "rgba(150,200,255,0.55)" };
const MATERIAL_EDGE: Record<string, string> = { wood: "#9C6B39", stone: "#8F8D84", glass: "#9CC0E8" };

function drawBird(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, type: string): void {
  const color = BIRD_COLOR[type] ?? "#F05B5B";
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(43,35,32,.25)";
  ctx.stroke();
  // 肚皮
  ctx.beginPath();
  ctx.ellipse(x - r * 0.18, y + r * 0.45, r * 0.5, r * 0.34, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,.85)";
  ctx.fill();
  // 眼睛
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(x + r * 0.32, y - r * 0.3, r * 0.34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2B2320";
  ctx.beginPath();
  ctx.arc(x + r * 0.4, y - r * 0.28, r * 0.17, 0, Math.PI * 2);
  ctx.fill();
  // 嘴
  ctx.beginPath();
  ctx.moveTo(x + r * 0.8, y);
  ctx.lineTo(x + r * 1.15, y);
  ctx.lineTo(x + r * 0.8, y + r * 0.22);
  ctx.closePath();
  ctx.fillStyle = "#FF8A00";
  ctx.fill();
  ctx.restore();
}

function drawPig(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, king: boolean): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = "#6AC857";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(43,35,32,.2)";
  ctx.stroke();
  // 鼻孔/脸
  ctx.fillStyle = "rgba(0,0,0,.18)";
  ctx.beginPath();
  ctx.arc(x, y + r * 0.28, r * 0.42, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2B2320";
  ctx.beginPath();
  ctx.arc(x - r * 0.2, y + r * 0.22, r * 0.08, 0, Math.PI * 2);
  ctx.arc(x + r * 0.2, y + r * 0.22, r * 0.08, 0, Math.PI * 2);
  ctx.fill();
  // 眼睛
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(x - r * 0.4, y - r * 0.35, r * 0.24, 0, Math.PI * 2);
  ctx.arc(x + r * 0.4, y - r * 0.35, r * 0.24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2B2320";
  ctx.beginPath();
  ctx.arc(x - r * 0.36, y - r * 0.34, r * 0.1, 0, Math.PI * 2);
  ctx.arc(x + r * 0.44, y - r * 0.34, r * 0.1, 0, Math.PI * 2);
  ctx.fill();
  if (king) {
    ctx.fillStyle = "#FFD23E";
    ctx.beginPath();
    ctx.moveTo(x - r * 0.5, y - r * 0.9);
    ctx.lineTo(x, y - r * 1.5);
    ctx.lineTo(x + r * 0.5, y - r * 0.9);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawSlingshot(ctx: CanvasRenderingContext2D, sx: number, sy: number, groundY: number): void {
  ctx.save();
  ctx.strokeStyle = "#6F4728";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(sx - 14, groundY);
  ctx.lineTo(sx - 10, sy - 60);
  ctx.lineTo(sx - 34, sy - 108);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(sx + 14, groundY);
  ctx.lineTo(sx + 10, sy - 60);
  ctx.lineTo(sx + 34, sy - 108);
  ctx.stroke();
  ctx.restore();
}

function drawBand(ctx: CanvasRenderingContext2D, sx: number, sy: number, bx: number, by: number): void {
  const p1 = { x: sx - 34, y: sy - 108 };
  const p2 = { x: sx + 34, y: sy - 108 };
  ctx.save();
  ctx.strokeStyle = "#2B2320";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(bx, by);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();
  ctx.restore();
}

function drawTrajectory(ctx: CanvasRenderingContext2D, sx: number, sy: number, bx: number, by: number): void {
  const dx = sx - bx;
  const dy = sy - by;
  const len = Math.hypot(dx, dy) || 1;
  const speed = Math.min(len, MAX_DRAG) * LAUNCH_POWER;
  let vx = (dx / len) * speed;
  let vy = (dy / len) * speed;
  let px = sx;
  let py = sy;
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,.9)";
  for (let i = 0; i < 90; i++) {
    vy += GRAVITY / 60;
    px += vx / 60;
    py += vy / 60;
    if (i % 4 === 0) {
      ctx.beginPath();
      ctx.arc(px, py, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    if (py > WORLD_H) break;
  }
  ctx.restore();
}

export function PlayClient({ level, nextId }: { level: Level; nextId: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const draggingRef = useRef(false);
  const pausedRef = useRef(false);

  const [score, setScore] = useState(0);
  const [birdsLeft, setBirdsLeft] = useState(level.availableBirds.length);
  const [result, setResult] = useState<GameResult | null>(null);
  const [paused, setPaused] = useState(false);
  const [isNewBest, setIsNewBest] = useState(false);
  const [abilityHint, setAbilityHint] = useState(level.availableBirds.includes("yellow") || level.availableBirds.includes("blue"));

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const eng = new GameEngine(
      level.layout,
      level.availableBirds,
      { targetScore: level.targetScore, starScore: level.starScore },
      (e) => {
        if (e.kind === "score") setScore(e.total);
        else if (e.kind === "bird-launched" || e.kind === "bird-settled") setBirdsLeft(eng.birdsLeft);
        else if (e.kind === "finished") {
          setResult(e.result);
          const newBest = recordScore(level.id, e.result.score, e.result.stars);
          setIsNewBest(newBest);
        }
      },
    );
    engineRef.current = eng;
    setBirdsLeft(eng.birdsLeft);

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.width * (WORLD_H / WORLD_W) * dpr));
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = now - last;
      last = now;
      if (!pausedRef.current && !eng.isFinished()) eng.update(dt);
      draw(canvas, eng);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [level]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  const toWorld = useCallback((e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * WORLD_W,
      y: ((e.clientY - rect.top) / rect.height) * WORLD_H,
    };
  }, []);

  const onDown = (e: React.PointerEvent) => {
    const eng = engineRef.current;
    if (!eng || result) return;
    const p = toWorld(e);
    if (eng.currentBird?.phase === "flying") {
      eng.activateAbility();
      setAbilityHint(false);
      return;
    }
    if (eng.currentBird?.phase === "ready") {
      draggingRef.current = true;
      eng.startDrag(p.x, p.y);
    }
  };
  const onMove = (e: React.PointerEvent) => {
    const eng = engineRef.current;
    if (!eng || !draggingRef.current) return;
    const p = toWorld(e);
    eng.dragTo(p.x, p.y);
  };
  const onUp = () => {
    const eng = engineRef.current;
    if (!eng) return;
    if (draggingRef.current) {
      eng.release();
      draggingRef.current = false;
    }
  };

  const onRestart = () => window.location.reload();
  const onShare = async () => {
    await copyText(`${SITE_ORIGIN}/level/${level.id}?from=share`);
    Toast.show({ content: "已复制成绩链接" });
  };

  return (
    <div className="play-root" style={{ maxWidth: 560, margin: "0 auto", position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", background: "#fff" }}>
        <button className="btn btn-ghost" style={{ minHeight: 36, padding: "4px 14px" }} type="button" onClick={() => setPaused((p) => !p)}>
          {paused ? "继续" : "暂停"}
        </button>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "var(--brand-weak)" }}>{level.displayName}</div>
          <div style={{ fontWeight: 800, fontSize: 20 }}>{score.toLocaleString("zh-CN")}</div>
        </div>
        <div style={{ display: "flex", gap: 4 }} aria-label={`剩余小鸟 ${birdsLeft} 只`}>
          {Array.from({ length: birdsLeft }).map((_, i) => (
            <span key={i} style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--brand-danger)" }} />
          ))}
        </div>
      </div>

      <div ref={wrapRef} style={{ width: "100%", aspectRatio: `${WORLD_W} / ${WORLD_H}`, background: "#dff1ff", position: "relative" }}>
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height: "100%", display: "block", touchAction: "none" }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onPointerLeave={onUp}
        />
        {abilityHint && !result && <div style={{ position: "absolute", bottom: 8, left: 0, right: 0, textAlign: "center", fontSize: 12, color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,.4)" }}>飞行中再点一下：黄鸟加速冲刺 · 蓝鸟俯冲增速</div>}
      </div>

      <p style={{ padding: "8px 16px 0", fontSize: 13, color: "var(--brand-weak)", margin: 0 }}>💡 {level.tip}</p>

      {paused && !result && (
        <Overlay>
          <div className="card" style={{ textAlign: "center", minWidth: 240 }}>
            <h2 style={{ fontSize: 18 }}>已暂停</h2>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 16 }}>
              <button className="btn btn-primary" type="button" onClick={() => setPaused(false)}>继续</button>
              <button className="btn btn-ghost" type="button" onClick={onRestart}>重新开始</button>
              <Link href="/levels" className="btn btn-ghost" onClick={() => setPaused(false)}>退出</Link>
            </div>
          </div>
        </Overlay>
      )}

      {result && (
        <Overlay>
          <div className="card" style={{ textAlign: "center", minWidth: 280 }}>
            <div style={{ fontSize: 40 }}>{result.won ? "🎉" : "😅"}</div>
            <h2 style={{ fontSize: 20, marginTop: 4 }}>{result.won ? "过关啦！" : "差一点"}</h2>
            <div style={{ fontSize: 28, color: "#FFB400", letterSpacing: 4, margin: "4px 0" }}>
              <span>{"★".repeat(result.stars)}</span>
              <span style={{ color: "#E6D9C8" }}>{"★".repeat(3 - result.stars)}</span>
            </div>
            <div style={{ fontWeight: 800, fontSize: 22 }}>{result.score.toLocaleString("zh-CN")} 分</div>
            {isNewBest && <div style={{ color: "var(--brand-green)", fontWeight: 700, marginTop: 4 }}>刷新最高分！</div>}
            <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
              {result.won && nextId <= 60 && (
                <Link href={`/play/${nextId}`} className="btn btn-primary" style={{ width: "100%" }}>
                  下一关：第 {nextId} 关
                </Link>
              )}
              <button className="btn btn-ghost" type="button" onClick={onRestart} style={{ width: "100%" }}>
                重试本关
              </button>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-ghost" type="button" style={{ flex: 1 }} onClick={onShare}>分享成绩</button>
                <button className="btn btn-ghost" type="button" style={{ flex: 1 }} onClick={() => Toast.show({ content: "支付功能即将上线" })}>
                  复活（预留）
                </button>
              </div>
            </div>
          </div>
        </Overlay>
      )}
    </div>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(43,35,32,.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: 24,
      }}
    >
      {children}
    </div>
  );
}

function draw(canvas: HTMLCanvasElement, eng: GameEngine): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const scale = canvas.width / WORLD_W;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);

  // 天空
  const sky = ctx.createLinearGradient(0, 0, 0, WORLD_H);
  sky.addColorStop(0, "#7ec8ff");
  sky.addColorStop(0.6, "#d8f1ff");
  sky.addColorStop(1, "#eef9ff");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);

  // 太阳
  ctx.fillStyle = "#FFD23E";
  ctx.beginPath();
  ctx.arc(880, 96, 46, 0, Math.PI * 2);
  ctx.fill();

  // 远山（视差剪影）
  ctx.fillStyle = "rgba(164,221,116,.75)";
  ctx.beginPath();
  ctx.moveTo(0, eng.groundY);
  ctx.quadraticCurveTo(180, eng.groundY - 130, 360, eng.groundY);
  ctx.quadraticCurveTo(560, eng.groundY - 90, 760, eng.groundY);
  ctx.quadraticCurveTo(900, eng.groundY - 70, 1000, eng.groundY);
  ctx.lineTo(1000, WORLD_H);
  ctx.lineTo(0, WORLD_H);
  ctx.closePath();
  ctx.fill();

  // 地面
  ctx.fillStyle = "#7CC653";
  ctx.fillRect(0, eng.groundY, WORLD_W, WORLD_H - eng.groundY);
  ctx.fillStyle = "#5AA839";
  ctx.fillRect(0, eng.groundY, WORLD_W, 8);

  const s = eng.slingshotPos;

  // 结构块
  for (const b of eng.blocks) {
    if (!b.alive) continue;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate((b.angle ?? 0) * (Math.PI / 180));
    ctx.fillStyle = MATERIAL_FILL[b.material] ?? "#C8945A";
    ctx.strokeStyle = MATERIAL_EDGE[b.material] ?? "#9C6B39";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.rect(-b.w / 2, -b.h / 2, b.w, b.h);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // 猪
  for (const p of eng.pigs) {
    if (!p.alive) continue;
    drawPig(ctx, p.x, p.y, p.r, p.tier === "king");
  }

  drawSlingshot(ctx, s.x, s.y, eng.groundY);

  // 发射后的鸟（除当前正在弹弓上的准备鸟）
  for (let i = 0; i < eng.birds.length; i++) {
    const b = eng.birds[i];
    if (!b) continue;
    if (b.phase === "ready" || b.phase === "dragging") continue;
    drawBird(ctx, b.x, b.y, b.r, b.type);
  }

  // 当前小鸟（弹弓上/拖拽中）
  const cur = eng.currentBird;
  if (cur && (cur.phase === "ready" || cur.phase === "dragging")) {
    drawBand(ctx, s.x, s.y, cur.x, cur.y);
    if (cur.phase === "dragging") drawTrajectory(ctx, s.x, s.y, cur.x, cur.y);
    drawBird(ctx, cur.x, cur.y, cur.r, cur.type);
  }

  // 粒子
  for (const p of eng.particles) {
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 2));
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}