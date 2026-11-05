// 《弹弓小队》游戏核心引擎 —— Matter.js 物理 + Canvas 渲染（纯模块，无 React 依赖，DOM 由 GameCanvas 驱动）
import Matter from "matter-js";
import { BLOCK_COLOR, MARBLE_COLOR, SLIME_COLOR } from "@/lib/constants";
import type { BlockKind, LevelDetail, MarbleType } from "@/lib/types";

export const WORLD_W = 1280;
export const WORLD_H = 720;
const GROUND_Y = 660;
const LAUNCHER = { x: 170, y: 560 };
const FORK = { l: { x: 148, y: 470 }, r: { x: 192, y: 470 } };
const MARBLE_R = 17;
const MAX_DRAG = 150;
const POWER = 0.16;

export interface GameResult {
  win: boolean;
  score: number;
  stars: number;
}

export interface GameCallbacks {
  onScore: (score: number) => void;
  onRemaining: (remaining: number, total: number) => void;
  onStateChange: (state: "aiming" | "flying" | "over") => void;
  onEnd: (result: GameResult) => void;
}

interface BodyData {
  kind: "block" | "target" | "marble";
  hp: number;
  blockKind: BlockKind;
  marbleType: MarbleType;
}

const BLOCK_HP: Record<BlockKind, number> = { wood: 1, glass: 1, stone: 2, iron: 4 };

function dataOf(body: Matter.Body): BodyData | undefined {
  return (body as Matter.Body & { gameData?: BodyData }).gameData;
}

interface ThemePalette {
  skyTop: string;
  skyBottom: string;
  ground: string;
}

const PALETTES: Record<string, ThemePalette> = {
  jungle: { skyTop: "#d9f2dd", skyBottom: "#bfe6c5", ground: "#7aa86b" },
  desert: { skyTop: "#ffe9c7", skyBottom: "#f7d9a0", ground: "#d9a95d" },
  snow: { skyTop: "#e8f3ff", skyBottom: "#cfe4f7", ground: "#cfe0ee" },
  town: { skyTop: "#fbe9dc", skyBottom: "#f3d3bd", ground: "#c98a6a" },
};

const DEFAULT_PALETTE: ThemePalette = { skyTop: "#fbe9dc", skyBottom: "#f3d3bd", ground: "#c98a6a" };

export class SlingshotGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private engine: Matter.Engine;
  private level: LevelDetail;
  private cb: GameCallbacks;
  private raf = 0;
  private running = false;
  private destroyed = false;
  private lastTick = 0;

  private queue: MarbleType[] = [];
  private totalMarbles = 0;
  private currentType: MarbleType = "fire";
  private marbleBody: Matter.Body | null = null;
  private flying = false;
  private dragging = false;
  private dragPos = { ...LAUNCHER };
  private score = 0;
  private state: "aiming" | "flying" | "over" = "aiming";
  private settleStart = 0;

  private targets = new Set<Matter.Body>();
  private blocks = new Set<Matter.Body>();
  private blocksById = new Map<number, Matter.Body>();
  private finished = false;
  private readonly collisionHandler: (ev: { pairs: Array<{ bodyA: Matter.Body; bodyB: Matter.Body }> }) => void;

  constructor(canvas: HTMLCanvasElement, level: LevelDetail, cb: GameCallbacks) {
    this.canvas = canvas;
    this.level = level;
    this.cb = cb;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    this.ctx = ctx;
    canvas.width = WORLD_W;
    canvas.height = WORLD_H;

    this.engine = Matter.Engine.create();
    this.engine.gravity.y = 1;

    this.totalMarbles = level.marbles.reduce((sum, m) => sum + m.count, 0);
    this.queue = level.marbles.flatMap((m) => Array.from({ length: m.count }, () => m.type));
    this.collisionHandler = (ev) => this.handleCollisions(ev.pairs);

    this.buildWorld();
    this.loadNextMarble(false);
    this.cb.onRemaining(this.queue.length, this.totalMarbles);
    this.cb.onScore(0);
  }

  private buildWorld(): void {
    const ground = Matter.Bodies.rectangle(WORLD_W / 2, GROUND_Y + 40, WORLD_W + 400, 80, {
      isStatic: true,
      label: "ground",
      friction: 0.8,
    });
    Matter.Composite.add(this.engine.world, ground);

    for (const ob of this.level.obstacles) {
      const body = Matter.Bodies.rectangle(ob.x, ob.y, ob.w, ob.h, {
        friction: 0.6,
        restitution: 0.1,
        density: ob.kind === "iron" ? 0.004 : ob.kind === "stone" ? 0.0025 : 0.0012,
        label: "block",
      });
      (body as Matter.Body & { gameData?: BodyData }).gameData = {
        kind: "block",
        hp: BLOCK_HP[ob.kind],
        blockKind: ob.kind,
        marbleType: "fire",
      };
      this.blocks.add(body);
      this.blocksById.set(body.id, body);
      Matter.Composite.add(this.engine.world, body);
    }

    for (const t of this.level.targetDefs) {
      const body = Matter.Bodies.circle(t.x, t.y, t.r, {
        friction: 0.5,
        restitution: 0.2,
        density: 0.0012,
        label: "target",
      });
      (body as Matter.Body & { gameData?: BodyData }).gameData = {
        kind: "target",
        hp: 1,
        blockKind: "wood",
        marbleType: "fire",
      };
      this.targets.add(body);
      Matter.Composite.add(this.engine.world, body);
    }

    Matter.Events.on(this.engine, "collisionStart", this.collisionHandler);
  }

  private loadNextMarble(emitRemaining = true): void {
    const next = this.queue.shift();
    if (next === undefined) {
      this.marbleBody = null;
      this.finish(this.targets.size === 0);
      return;
    }
    this.currentType = next;
    this.flying = false;
    this.dragging = false;
    // 瞄准阶段视为静态（避免发射前因重力掉落）；先建动态体再 setStatic(true)，发射时 setStatic(false) 复原质量
    this.marbleBody = Matter.Bodies.circle(LAUNCHER.x, LAUNCHER.y, MARBLE_R, {
      friction: 0.05,
      restitution: 0.4,
      density: 0.0022,
      label: "marble",
    });
    (this.marbleBody as Matter.Body & { gameData?: BodyData }).gameData = {
      kind: "marble",
      hp: 1,
      blockKind: "wood",
      marbleType: next,
    };
    Matter.Body.setStatic(this.marbleBody, true);
    Matter.Composite.add(this.engine.world, this.marbleBody);
    if (emitRemaining) this.cb.onRemaining(this.queue.length, this.totalMarbles);
    this.setState("aiming");
  }

  // ---------- 外部交互 ----------
  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTick = performance.now();
    const loop = (now: number) => {
      if (this.destroyed) return;
      const delta = Math.min(50, now - this.lastTick);
      this.lastTick = now;
      Matter.Engine.update(this.engine, 16.666);
      this.step(delta);
      this.render();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  pointerDown(wx: number, wy: number): void {
    if (this.state !== "aiming" || !this.marbleBody) return;
    const anchor = this.marbleBody.position;
    const d = Math.hypot(wx - anchor.x, wy - anchor.y);
    if (d < 130) {
      this.dragging = true;
      this.dragPos = { x: anchor.x, y: anchor.y };
    }
  }

  pointerMove(wx: number, wy: number): void {
    if (!this.dragging || !this.marbleBody) return;
    let vx = wx - LAUNCHER.x;
    let vy = wy - LAUNCHER.y;
    const len = Math.hypot(vx, vy);
    if (len > MAX_DRAG) {
      vx = (vx / len) * MAX_DRAG;
      vy = (vy / len) * MAX_DRAG;
    }
    // 向下限拉，避免穿地
    this.dragPos = { x: Math.max(40, LAUNCHER.x + vx), y: Math.min(GROUND_Y - 8, LAUNCHER.y + vy) };
    Matter.Body.setPosition(this.marbleBody, this.dragPos);
  }

  pointerUp(): void {
    if (!this.dragging || !this.marbleBody) {
      this.dragging = false;
      return;
    }
    this.dragging = false;
    const vx = (LAUNCHER.x - this.marbleBody.position.x) * POWER;
    const vy = (LAUNCHER.y - this.marbleBody.position.y) * POWER;
    if (Math.hypot(vx, vy) < 1.5) {
      Matter.Body.setPosition(this.marbleBody, { x: LAUNCHER.x, y: LAUNCHER.y });
      return;
    }
    this.flying = true;
    this.settleStart = performance.now();
    Matter.Body.setStatic(this.marbleBody, false);
    Matter.Body.setVelocity(this.marbleBody, { x: vx, y: vy });
    this.setState("flying");
  }

  // ---------- 内部物理 ----------
  private step(_delta: number): void {
    if (this.finished) return;

    if (this.flying && this.marbleBody) {
      const p = this.marbleBody.position;
      const speed = this.marbleBody.speed;
      const elapsed = performance.now() - this.settleStart;
      const outOfBounds = p.x < -120 || p.x > WORLD_W + 240 || p.y > WORLD_H + 240;
      if (speed < 0.4 || outOfBounds || elapsed > 8000) {
        this.flying = false;
        Matter.Composite.remove(this.engine.world, this.marbleBody);
        this.marbleBody = null;
        if (this.targets.size === 0) {
          this.finish(true);
        } else {
          this.loadNextMarble();
        }
      }
    }
  }

  private handleCollisions(pairs: Array<{ bodyA: Matter.Body; bodyB: Matter.Body }>): void {
    for (const pair of pairs) {
      const a = pair.bodyA;
      const b = pair.bodyB;
      const da = dataOf(a);
      const db = dataOf(b);

      // 弹珠命中目标/障碍
      if (da?.kind === "marble" && db && db.kind !== "marble") {
        if (a.speed > 3) this.applyImpact(b, a.speed);
        continue;
      }
      if (db?.kind === "marble" && da && da.kind !== "marble") {
        if (b.speed > 3) this.applyImpact(a, b.speed);
        continue;
      }

      // 障碍砸中软泥怪（坠落压碎）
      if (da?.kind === "block" && db?.kind === "target" && Math.max(a.speed, b.speed) > 7) {
        this.applyImpact(b, 6);
        continue;
      }
      if (db?.kind === "block" && da?.kind === "target" && Math.max(a.speed, b.speed) > 7) {
        this.applyImpact(a, 6);
        continue;
      }

      // 障碍互撞（连锁坍塌）
      if (da?.kind === "block" && db?.kind === "block" && Math.max(a.speed, b.speed) > 9) {
        const weaker = a.speed >= b.speed ? b : a;
        this.applyImpact(weaker, 5);
      }
    }
  }

  private applyImpact(body: Matter.Body, force: number): void {
    const d = dataOf(body);
    if (!d) return;
    if (d.kind === "target") {
      this.destroyTarget(body);
      return;
    }
    if (d.kind === "block") {
      const damage = force > 9 && d.blockKind === "iron" ? 0 : 1;
      if (damage > 0) d.hp -= damage;
      if (d.hp <= 0) this.destroyBlock(body);
    }
  }

  private destroyTarget(body: Matter.Body): void {
    if (!this.targets.has(body)) return;
    this.targets.delete(body);
    Matter.Composite.remove(this.engine.world, body);
    this.score += 1000;
    this.cb.onScore(this.score);
    if (this.targets.size === 0 && !this.finished) {
      // 延时判定，让最后一击的连锁反映出来
      this.finish(true);
    }
  }

  private destroyBlock(body: Matter.Body): void {
    if (!this.blocks.has(body)) return;
    this.blocks.delete(body);
    this.blocksById.delete(body.id);
    Matter.Composite.remove(this.engine.world, body);
    this.score += 100;
    this.cb.onScore(this.score);
  }

  private finish(win: boolean): void {
    if (this.finished) return;
    this.finished = true;
    // 胜利时才兑现「剩余弹珠奖励」；已发射未结算的当前弹珠计为已使用
    const unused = win ? this.queue.length : 0;
    const total = this.totalMarbles;
    const ratio = total > 0 ? unused / total : 0;
    const stars = win ? (ratio >= 0.5 ? 3 : ratio >= 0.25 ? 2 : 1) : 0;
    const bonus = win ? unused * 500 : 0;
    this.score += bonus;
    this.cb.onScore(this.score);
    this.setState("over");
    this.cb.onEnd({ win, score: this.score, stars });
  }

  private setState(s: "aiming" | "flying" | "over"): void {
    this.state = s;
    this.cb.onStateChange(s);
  }

  // ---------- 渲染 ----------
  private render(): void {
    const ctx = this.ctx;
    const pal = PALETTES[this.level.theme] ?? DEFAULT_PALETTE;

    // 天空渐变
    const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    sky.addColorStop(0, pal.skyTop);
    sky.addColorStop(1, pal.skyBottom);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, WORLD_W, GROUND_Y + 1);

    // 地面
    ctx.fillStyle = pal.ground;
    ctx.fillRect(0, GROUND_Y, WORLD_W, WORLD_H - GROUND_Y);

    // 轨迹预览（拖拽时）
    if (this.dragging && this.marbleBody) {
      const vx = (LAUNCHER.x - this.marbleBody.position.x) * POWER;
      const vy = (LAUNCHER.y - this.marbleBody.position.y) * POWER;
      this.drawTrajectory(ctx, this.marbleBody.position, vx, vy);
    }

    // 障碍块
    for (const body of this.blocks) {
      const d = dataOf(body);
      if (!d) continue;
      this.drawBlock(ctx, body, d.blockKind);
    }

    // 软泥怪
    for (const body of this.targets) this.drawSlime(ctx, body);

    // 弹射当前弹珠
    if (this.marbleBody) this.drawMarble(ctx, this.marbleBody, this.currentType);

    // 弹弓
    if (this.state !== "over") this.drawSlingshot(ctx);

    // 进度角标（剩余弹珠）
    this.drawHud(ctx);
  }

  private drawTrajectory(ctx: CanvasRenderingContext2D, from: { x: number; y: number }, vx: number, vy: number): void {
    ctx.save();
    ctx.strokeStyle = "rgba(43,42,40,0.55)";
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    let x = from.x;
    let y = from.y;
    let cvx = vx;
    let cvy = vy;
    const g = 0.6; // 视觉重力
    ctx.moveTo(x, y);
    for (let i = 0; i < 50; i++) {
      x += cvx * 0.86;
      y += cvy * 0.86;
      cvy += g;
      if (y > GROUND_Y - 8) break;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  private drawBlock(ctx: CanvasRenderingContext2D, body: Matter.Body, kind: BlockKind): void {
    const d = dataOf(body);
    ctx.save();
    ctx.translate(body.position.x, body.position.y);
    ctx.rotate(body.angle);
    ctx.fillStyle = kind === "glass" ? "rgba(155,216,232,0.62)" : BLOCK_COLOR[kind];
    ctx.strokeStyle = "rgba(43,42,40,0.28)";
    ctx.lineWidth = 2;
    const w = (body as Matter.Body & { circleRadius?: number }).circleRadius
      ? (body as Matter.Body & { circleRadius?: number }).circleRadius! * 2
      : 0;
    const bw = w || this.blockWidth(body);
    const bh = w || this.blockHeight(body);
    if (kind === "stone" || kind === "iron") {
      ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
      ctx.strokeRect(-bw / 2, -bh / 2, bw, bh);
    } else {
      this.roundRect(ctx, -bw / 2, -bh / 2, bw, bh, 4);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
    void d;
  }

  private blockWidth(body: Matter.Body): number {
    return Math.max(20, Math.abs(body.bounds.max.x - body.bounds.min.x));
  }
  private blockHeight(body: Matter.Body): number {
    return Math.max(12, Math.abs(body.bounds.max.y - body.bounds.min.y));
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  private drawSlime(ctx: CanvasRenderingContext2D, body: Matter.Body): void {
    const r = (body as Matter.Body & { circleRadius?: number }).circleRadius ?? 16;
    ctx.save();
    ctx.translate(body.position.x, body.position.y);
    ctx.rotate(body.angle);
    ctx.fillStyle = SLIME_COLOR;
    ctx.strokeStyle = "rgba(43,42,40,0.2)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // 眼睛
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(-r * 0.4, -r * 0.25, r * 0.28, 0, Math.PI * 2);
    ctx.arc(r * 0.4, -r * 0.25, r * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#2B2A28";
    ctx.beginPath();
    ctx.arc(-r * 0.4, -r * 0.22, r * 0.13, 0, Math.PI * 2);
    ctx.arc(r * 0.4, -r * 0.22, r * 0.13, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawMarble(ctx: CanvasRenderingContext2D, body: Matter.Body, type: MarbleType): void {
    ctx.save();
    ctx.translate(body.position.x, body.position.y);
    ctx.rotate(body.angle);
    ctx.fillStyle = MARBLE_COLOR[type];
    ctx.strokeStyle = "rgba(43,42,40,0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, MARBLE_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.beginPath();
    ctx.arc(-MARBLE_R * 0.32, -MARBLE_R * 0.32, MARBLE_R * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawSlingshot(ctx: CanvasRenderingContext2D): void {
    const mp = this.marbleBody ? this.marbleBody.position : { x: LAUNCHER.x, y: LAUNCHER.y };
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineWidth = 7;
    ctx.strokeStyle = "#7a4f2b";
    ctx.beginPath();
    ctx.moveTo(LAUNCHER.x, LAUNCHER.y);
    ctx.lineTo(FORK.l.x, FORK.l.y);
    ctx.moveTo(LAUNCHER.x, LAUNCHER.y);
    ctx.lineTo(FORK.r.x, FORK.r.y);
    ctx.stroke();
    // 皮筋
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#e5484d";
    ctx.beginPath();
    ctx.moveTo(FORK.l.x, FORK.l.y);
    ctx.lineTo(mp.x, mp.y);
    ctx.lineTo(FORK.r.x, FORK.r.y);
    ctx.stroke();
    ctx.restore();
  }

  private drawHud(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.fillStyle = "rgba(43,42,40,0.72)";
    ctx.font = "700 28px -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`得分 ${this.score}`, 24, 52);
    ctx.textAlign = "right";
    ctx.fillText(`剩余弹珠 ${this.queue.length}`, WORLD_W - 24, 52);
    ctx.restore();
  }

  destroy(): void {
    this.destroyed = true;
    this.running = false;
    cancelAnimationFrame(this.raf);
    Matter.Events.off(this.engine, "collisionStart", this.collisionHandler);
    Matter.World.clear(this.engine.world, false);
    Matter.Engine.clear(this.engine);
  }
}