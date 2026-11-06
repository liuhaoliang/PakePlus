import { NextResponse } from "next/server";
import type { MeProfile } from "@/lib/types";

// 我的进度/星级/历史（登录态，mock）：游客兜底，真实数据来自前端 localStorage；OAuth 同步预留。
export function GET() {
  const data: MeProfile = {
    uid: "u_guest",
    nickname: "游客",
    avatarColor: "#FFD23E",
    cleared: 0,
    totalStars: 0,
    bestTotal: 0,
    levelStars: {},
    recent: [],
  };
  return NextResponse.json({ code: 0, message: "ok", data });
}