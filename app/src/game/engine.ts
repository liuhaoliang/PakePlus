// 自研轻量 2D 物理引擎（弹弓-抛射-碰撞-摧毁-重力坍塌）。
// 纯逻辑、无 React/DOM 依赖：React 组件只负责输入映射与 Canvas 渲染。
// 世界坐标系：x 向右、y 向下；世界尺寸 1000×650，与关卡 layout 坐标一致。

import type { BirdType, BlockMaterial, LevelLayout, PigTier } from "@/lib/types";
import { BIRD_BONUS, BLOCK_SCORE, PIG_SCORE } from "@/lib/constants";

export const WORLD_W = 1000;
export const WORLD_H = 650;

export const BIRD_RADIUS: Record<BirdType, number> = { red: 16, yellow: 15, blue: 20 };

export const GRAVITY = 900;
export const MAX_DRAG = 84;
export const LAUNCH_POWER = 9.6;
const SETTLE_SPEED = 42;
const BLOCK_HP: Record<string, number> = { glass: 1, wood: 1, stone: 2 };
const BLOCK_BREAK: Record<string, number> = { glass: 150, wood: 260, stone: 430 };
const FALL_DAMAGE_SPEED = 320;

export type BirdPhase = "ready" | "dragging" | "flying" | "done";

export interface BirdBody {
  type: BirdType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  phase: BirdPhase;
}

export interface PigBody {
  x: number;
  y: number;
  r: number;
  hp: number;
  tier: PigTier;
  alive: boolean;
  falling: boolean;
  vy: number;
}

export interface BlockBody {
  x: number;
  y: number;
  w: number;
  h: number;
  material: BlockMaterial;
  angle: number;
  hp: number;
  alive: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  r: number;
}

export interface GameResult {
  won: boolean;
  score: number;
  stars: 0 | 1 | 2 | 3;
  birdsUsed: number;
}

export type GameEvent =
  | { kind: "score"; delta: number; total: number }
  | { kind: "bird-launched"; index: number }
  | { kind: "bird-settled" }
  | { kind: "pig-pop"; x: number; y: number }
  | { kind: "block-break"; x: number; y: number }
  | { kind: "finished"; result: GameResult };

export class GameEngine {
  readonly groundY: number;
  private readonly slingshot: { x: number; y: number };
  private readonly birdQueue: BirdType[];
  private readonly targetScore: number;
  private readonly starScore: [number, number];

  birds: BirdBody[] = [];
  currentBirdIndex = -1;
  pigs: PigBody[] = [];
  blocks: BlockBody[] = [];
  particles: Particle[] = [];
  score = 0;

  private launched = 0;
  private finished: GameResult | null = null;
  private settleTimer = 0;

  private onEvent: (e: GameEvent) => void;

  constructor(
    layout: LevelLayout,
    birdQueue: BirdType[],
    opts: { targetScore: number; starScore: [number, number] },
    onEvent: (e: GameEvent) => void,
  ) {
    this.groundY = layout.groundY;
    this.slingshot = layout.slingshot;
    this.birdQueue = [...birdQueue];
    this.targetScore = opts.targetScore;
    this.starScore = opts.starScore;
    this.onEvent = onEvent;
    this.pigs = layout.pigs.map((p) => ({ ...p, vy: 0, alive: true, falling: false }));
    this.blocks = layout.blocks.map((b) => ({
      ...b,
      angle: b.angle ?? 0,
      hp: BLOCK_HP[b.material] ?? 1,
      alive: true,
    }));
    this.loadNextBird();
  }

  loadNextBird(): void {
    const type = this.birdQueue[this.launched];
    if (!type) return;
    this.currentBirdIndex = this.launched;
    const r = BIRD_RADIUS[type];
    this.birds[this.launched] = {
      type,
      x: this.slingshot.x,
      y: this.slingshot.y,
      vx: 0,
      vy: 0,
      r,
      phase: "ready",
    };
  }

  get currentBird(): BirdBody | undefined {
    return this.birds[this.currentBirdIndex];
  }

  get slingshotPos(): { x: number; y: number } {
    return { ...this.slingshot };
  }

  get birdsLeft(): number {
    return this.birdQueue.length - this.launched;
  }

  isFinished(): boolean {
    return this.finished !== null;
  }

  // ---------- 输入 ----------
  startDrag(x: number, y: number): void {
    const b = this.currentBird;
    if (!b || b.phase !== "ready" || this.finished) return;
    b.phase = "dragging";
    b.x = x;
    b.y = y;
  }

  dragTo(x: number, y: number): void {
    const b = this.currentBird;
    if (!b || b.phase !== "dragging") return;
    let dx = x - this.slingshot.x;
    let dy = y - this.slingshot.y;
    const len = Math.hypot(dx, dy) || 1;
    if (len > MAX_DRAG) {
      dx = (dx / len) * MAX_DRAG;
      dy = (dy / len) * MAX_DRAG;
    }
    b.x = this.slingshot.x + dx;
    b.y = this.slingshot.y + dy;
  }

  release(): void {
    const b = this.currentBird;
    if (!b || b.phase !== "dragging") return;
    const dx = this.slingshot.x - b.x;
    const dy = this.slingshot.y - b.y;
    const len = Math.hypot(dx, dy);
    if (len < 12) {
      // 拉得太少：回到弹弓，不算发射
      b.x = this.slingshot.x;
      b.y = this.slingshot.y;
      b.phase = "ready";
      return;
    }
    const speed = Math.min(len, MAX_DRAG) * LAUNCH_POWER;
    b.vx = (dx / len) * speed;
    b.vy = (dy / len) * speed;
    b.phase = "flying";
    this.launched += 1;
    this.onEvent({ kind: "bird-launched", index: this.currentBirdIndex });
  }

  /** 黄鸟：飞行途中二段加速；蓝鸟：重型冲击（重置为高伤害标记由碰撞逻辑处理） */
  activateAbility(): void {
    const b = this.currentBird;
    if (!b || b.phase !== "flying") return;
    if (b.type === "yellow") {
      const s = Math.hypot(b.vx, b.vy) || 1;
      b.vx = (b.vx / s) * (s * 1.7 + 260);
      b.vy = (b.vy / s) * (s * 1.7 + 260);
      this.spawnParticles(b.x, b.y, "#FFD23E", 6);
    } else if (b.type === "blue") {
      const s = Math.hypot(b.vx, b.vy) || 1;
      b.vx = (b.vx / s) * (s * 1.35);
      b.vy = (b.vy / s) * (s * 1.35);
    }
  }

  // ---------- 主循环（dtMs 毫秒，内部固定步长 1/60） ----------
  private acc = 0;

  update(dtMs: number): void {
    if (this.finished) return;
    let steps = 0;
    this.acc += Math.min(dtMs, 200);
    while (this.acc >= 1000 / 60 && steps < 6) {
      this.step(1 / 60);
      this.acc -= 1000 / 60;
      steps += 1;
    }
    this.updateParticles(dtMs / 1000);
    if (steps < 6) this.acc = 0;
  }

  private step(dt: number): void {
    // 飞行中的小鸟
    const b = this.currentBird;
    if (b && b.phase === "flying") {
      b.vy += GRAVITY * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      this.collideBird(b);
      const speed = Math.hypot(b.vx, b.vy);
      if (
        speed < SETTLE_SPEED ||
        b.x > WORLD_W + 60 ||
        b.x < -60 ||
        b.y > this.groundY + 40 ||
        (b.y + b.r >= this.groundY && speed < 200 && b.vy > 0)
      ) {
        b.phase = "done";
        this.settleTimer = 0.45;
        this.onEvent({ kind: "bird-settled" });
        this.afterSettle();
      }
    }

    // 坍塌中的猪
    for (const p of this.pigs) {
      if (!p.alive || !p.falling) continue;
      p.vy += GRAVITY * dt;
      p.y += p.vy * dt;
      if (p.y + p.r >= this.groundY) {
        p.y = this.groundY - p.r;
        if (p.vy > FALL_DAMAGE_SPEED) this.damagePig(p, 1);
        p.falling = false;
        p.vy = 0;
      } else {
        const top = this.blockTopUnder(p.x);
        if (top !== null && p.y + p.r >= top - 1 && p.y + p.r <= top + 20) {
          p.y = top - p.r;
          if (p.vy > FALL_DAMAGE_SPEED) this.damagePig(p, 1);
          p.falling = false;
          p.vy = 0;
        }
      }
    }

    // 结算后等待
    if (this.settleTimer > 0) {
      this.settleTimer -= dt;
      if (this.settleTimer <= 0) {
        if (this.countAlivePigs() === 0) {
          this.finish(true);
        } else if (this.birdsLeft <= 0) {
          this.finish(false);
        } else {
          this.loadNextBird();
        }
      }
    }
  }

  private afterSettle(): void {
    this.recomputeFalling();
  }

  private recomputeFalling(): void {
    for (const p of this.pigs) {
      if (!p.alive) continue;
      if (!this.pigSupported(p)) p.falling = true;
    }
  }

  private pigSupported(p: PigBody): boolean {
    if (p.y + p.r >= this.groundY - 0.5) return true;
    const top = this.blockTopUnder(p.x);
    return top !== null && Math.abs(p.y + p.r - top) < 18;
  }

  /** 返回猪脚下最近的存活块顶面 y（无则为 null） */
  private blockTopUnder(x: number): number | null {
    let best: number | null = null;
    for (const blk of this.blocks) {
      if (!blk.alive) continue;
      const hw = blk.w / 2 + 4;
      if (x < blk.x - hw || x > blk.x + hw) continue;
      const top = blk.y - blk.h / 2;
      if (best === null || top < best) best = top;
    }
    return best;
  }

  // ---------- 碰撞 ----------
  private collideBird(b: BirdBody): void {
    for (const blk of this.blocks) {
      if (!blk.alive) continue;
      const cx = clamp(b.x, blk.x - blk.w / 2, blk.x + blk.w / 2);
      const cy = clamp(b.y, blk.y - blk.h / 2, blk.y + blk.h / 2);
      const dx = b.x - cx;
      const dy = b.y - cy;
      const dist2 = dx * dx + dy * dy;
      if (dist2 > b.r * b.r) continue;
      const ang = Math.atan2(dy || 0, dx || 0);
      // 把鸟推出块外，避免粘连
      b.x = cx + Math.cos(ang) * (b.r + 1);
      b.y = cy + Math.sin(ang) * (b.r + 1);
      const speed = Math.hypot(b.vx, b.vy);
      const threshold = BLOCK_BREAK[blk.material] ?? 300;
      if (speed >= threshold) {
        this.breakBlock(blk, b.x, b.y);
      }
      // 反弹：法向翻转 + 速度衰减
      const nx = Math.cos(ang);
      const ny = Math.sin(ang);
      const dot = b.vx * nx + b.vy * ny;
      if (dot < 0) {
        b.vx -= 1.7 * dot * nx;
        b.vy -= 1.7 * dot * ny;
        b.vx *= 0.55;
        b.vy *= 0.55;
      }
      return;
    }
    for (const p of this.pigs) {
      if (!p.alive) continue;
      const dx = b.x - p.x;
      const dy = b.y - p.y;
      const rr = b.r + p.r;
      if (dx * dx + dy * dy > rr * rr) continue;
      const speed = Math.hypot(b.vx, b.vy);
      const dmg = speed >= 480 ? 2 : 1;
      this.damagePig(p, dmg);
      // 鸟减速继续，允许串串
      b.vx *= 0.5;
      b.vy *= 0.5;
      const dist = Math.hypot(dx, dy) || 1;
      b.x = p.x + (dx / dist) * rr;
      b.y = p.y + (dy / dist) * rr;
    }
  }

  private breakBlock(blk: BlockBody, hitX: number, hitY: number): void {
    blk.hp -= 1;
    this.spawnParticles(hitX, hitY, materialColor(blk.material), 8);
    if (blk.hp <= 0) {
      blk.alive = false;
      this.addScore(BLOCK_SCORE[blk.material] ?? 300);
      this.onEvent({ kind: "block-break", x: blk.x, y: blk.y });
      this.recomputeFalling();
    }
  }

  private damagePig(p: PigBody, dmg: number): void {
    if (!p.alive) return;
    p.hp -= dmg;
    if (p.hp <= 0) {
      p.alive = false;
      this.addScore(PIG_SCORE[p.tier] ?? 1000);
      this.onEvent({ kind: "pig-pop", x: p.x, y: p.y });
      this.spawnParticles(p.x, p.y, p.tier === "king" ? "#FFD23E" : "#64C24E", 12);
      this.recomputeFalling();
      if (this.countAlivePigs() === 0 && this.currentBird?.phase !== "flying") {
        // 若全部猪已击倒（例如落石压死），延迟结算
        this.settleTimer = Math.max(this.settleTimer, 0.2);
      }
    }
  }

  private countAlivePigs(): number {
    return this.pigs.filter((p) => p.alive).length;
  }

  private addScore(delta: number): void {
    this.score += delta;
    this.onEvent({ kind: "score", delta, total: this.score });
  }

  private finish(won: boolean): void {
    if (this.finished) return;
    // 剩余小鸟奖励
    const bonus = this.birdsLeft * BIRD_BONUS;
    if (bonus > 0) this.score += bonus;
    const stars = computeStars(this.score, this.targetScore, this.starScore);
    this.finished = { won, score: this.score, stars, birdsUsed: this.launched };
    this.onEvent({ kind: "finished", result: this.finished });
  }

  // ---------- 粒子 ----------
  private spawnParticles(x: number, y: number, color: string, count: number): void {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 60 + Math.random() * 220;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 60,
        life: 0.5 + Math.random() * 0.5,
        color,
        r: 2 + Math.random() * 3,
      });
    }
  }

  private updateParticles(dt: number): void {
    for (const p of this.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 400 * dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
  }
}

export function computeStars(score: number, targetScore: number, starScore: [number, number]): 0 | 1 | 2 | 3 {
  if (score >= starScore[1]) return 3;
  if (score >= starScore[0]) return 2;
  if (score >= targetScore) return 1;
  return 0;
}

function clamp(v: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, v));
}

function materialColor(m: string): string {
  if (m === "stone") return "#B9B7AD";
  if (m === "glass") return "#BFE3FF";
  return "#C8945A";
}