"use client";

import { loadProgress, recordResult, totalStarCount } from "@/lib/storage";
import type { ProgressMap } from "@/lib/types";
import { useCallback, useEffect, useState } from "react";

/** 本机进度（客户端挂载后加载，游客/未登录也生效）。 */
export function useProgress(): {
  progress: ProgressMap;
  totalStars: number;
  record: (levelId: string, score: number, stars: number) => void;
} {
  const [progress, setProgress] = useState<ProgressMap>({});
  useEffect(() => {
    setProgress(loadProgress());
  }, []);
  const record = useCallback((levelId: string, score: number, stars: number) => {
    setProgress(recordResult(levelId, score, stars));
  }, []);
  const totalStars = totalStarCount(progress);
  return { progress, totalStars, record };
}