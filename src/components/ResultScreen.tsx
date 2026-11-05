"use client";

import { Toast } from "antd-mobile";
import { useParams, useRouter } from "next/navigation";
import { copyText } from "@/container";
import { encodeShareId } from "@/lib/api";
import { LEVELS } from "@/lib/levels";
import { useProgress } from "@/hooks/useProgress";
import { useEffect, useRef, useState } from "react";
import Stars from "./Stars";

function parseQuery(): { score: number; stars: number } {
  if (typeof window === "undefined") return { score: 0, stars: 0 };
  const sp = new URLSearchParams(window.location.search);
  const score = Number(sp.get("score") ?? "0");
  const stars = Math.min(3, Math.max(0, Number(sp.get("stars") ?? "0")));
  return { score: Number.isFinite(score) ? score : 0, stars: Number.isFinite(stars) ? stars : 0 };
}

export default function ResultScreen() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id ?? "lv-01";
  const level = LEVELS.find((l) => l.id === id) ?? LEVELS[0];
  const { progress, record } = useProgress();

  const [score, setScore] = useState(0);
  const [stars, setStars] = useState(0);
  const recordedRef = useRef(false);

  // 客户端读取本局结果（避免静态生成时读取 window）
  useEffect(() => {
    const q = parseQuery();
    setScore(q.score);
    setStars(q.stars);
  }, []);

  useEffect(() => {
    if (!recordedRef.current && score > 0 && level) {
      record(id, score, stars);
      recordedRef.current = true;
    }
  }, [score, stars, id, level, record]);

  const prevBest = id ? progress[id]?.score ?? 0 : 0;
  const isNewRecord = score > 0 && score >= prevBest && prevBest > 0;
  const win = stars > 0;

  const idx = LEVELS.findIndex((l) => l.id === id);
  const nextId = idx >= 0 && idx < LEVELS.length - 1 ? LEVELS[idx + 1]?.id : null;

  const share = async () => {
    if (!level) return;
    const shareId = encodeShareId({ levelId: level.id, score, stars });
    const url = `${window.location.origin}/share/${shareId}`;
    const ok = await copyText(url);
    Toast.show({ content: ok ? "成绩链接已复制，快分享给好友" : "复制失败，请手动复制链接" });
    if (ok) window.history.replaceState(null, "", `/share/${shareId}`);
  };

  return (
    <div className="shell">
      <div className="card" style={{ textAlign: "center", padding: "28px 16px" }}>
        <img
          src={win ? "/images/result/win.png" : "/images/result/lose.png"}
          alt={win ? "通关庆祝" : "差一点"}
          style={{ width: 180, height: 180, margin: "0 auto 8px" }}
        />
        <div className="tagline-hero">
          {score} 分 <Stars count={stars} />
        </div>
        <p className="muted">
          {win ? (isNewRecord ? "新纪录！" : `${level?.name ?? "本关"} 通关`) : "差一点点，再试一次"}
          {prevBest > 0 ? ` · 历史最优 ${prevBest}` : ""}
        </p>
      </div>

      <div className="cta-stack">
        <button type="button" className="btn btn-primary btn-block" onClick={() => router.replace(`/play/${id}`)}>
          重玩本关
        </button>
        {nextId && (
          <button type="button" className="btn btn-block" onClick={() => router.replace(`/play/${nextId}`)}>
            下一关
          </button>
        )}
        <button type="button" className="btn btn-ghost btn-block" onClick={() => router.push("/leaderboard")}>
          看排行榜
        </button>
        {win && (
          <button type="button" className="btn btn-ghost btn-block" onClick={share}>
            炫耀一下（复制链接）
          </button>
        )}
      </div>
    </div>
  );
}