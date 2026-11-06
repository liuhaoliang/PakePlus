import { NextResponse } from "next/server";

// 好友榜（登录态，预留）：本期 mock 无 OAuth，未登录返回 401。
export function GET() {
  return NextResponse.json({ code: 401, message: "请先登录后查看好友榜", data: [] }, { status: 401 });
}