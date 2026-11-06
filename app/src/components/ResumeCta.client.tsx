"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadSave } from "@/lib/storage";
import { LEVELS } from "@/lib/mock/data";

/** 首页「开始游戏 / 继续第 Y 关」：SSR 出通用文案，hydrate 后按本地存档续档。 */
export function ResumeCta() {
  const [nextId, setNextId] = useState<number>(1);
  const [hasProgress, setHasProgress] = useState<boolean>(false);

  useEffect(() => {
    const save = loadSave();
    const cleared = Object.keys(save.levelStars).filter((k) => (save.levelStars[k] ?? 0) > 0).map(Number);
    if (cleared.length > 0) {
      const max = Math.max(...cleared);
      setNextId(Math.min(max + 1, LEVELS.length || 60));
      setHasProgress(true);
    }
  }, []);

  return (
    <Link href={`/play/${nextId}`} className="btn btn-primary" style={{ fontSize: 18, padding: "14px 36px" }}>
      {hasProgress ? `继续第 ${nextId} 关` : "开始游戏"}
    </Link>
  );
}