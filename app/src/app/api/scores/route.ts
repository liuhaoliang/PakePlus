import { NextResponse } from "next/server";
import type { Score } from "@/lib/types";

// 提交单关分数/星级（登录态，mock）：本期以 localStorage 为源，这里仅在内存回执。
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Partial<Score> | null;
  if (!body || !Number.isInteger(body.levelId) || typeof body.score !== "number") {
    return NextResponse.json({ code: 400, message: "参数不合法", data: null }, { status: 400 });
  }
  return NextResponse.json({
    code: 0,
    message: "ok",
    data: { ok: true, isNewBest: body.isNewBest ?? false },
  });
}