import { NextResponse } from "next/server";
import { LEADERBOARD, getLevelLeaderboard, paginate } from "@/lib/mock/data";

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") === "level" ? "level" : "total";
  const levelId = Math.max(1, Number(searchParams.get("levelId") ?? 1));
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.max(1, Number(searchParams.get("pageSize") ?? 20));
  const list = type === "total" ? LEADERBOARD : getLevelLeaderboard(levelId);
  const { items, ...meta } = paginate(list, page, pageSize);
  return NextResponse.json({ code: 0, message: "ok", data: items, page: meta });
}