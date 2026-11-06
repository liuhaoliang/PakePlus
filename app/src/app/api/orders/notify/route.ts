import { NextResponse } from "next/server";

// 支付宝异步通知（服务端签名，预留）。真实环境需验签 alipay-sdk；本期为占位。
export async function POST() {
  return NextResponse.json({ code: 0, message: "ok", data: { handled: false } });
}