import { NextResponse } from "next/server";
import { createOrder } from "@/lib/pay-server";

// 创建 alipay.trade.wap.pay 订单（预留）。真实环境需企业 AppId/密钥；本期返回 created 占位 + 「即将上线」。
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { subject?: string; amount?: string } | null;
  const order = createOrder(body?.subject ?? "复活×3", body?.amount ?? "100");
  return NextResponse.json({
    code: 0,
    message: "支付功能即将上线，已创建占位订单",
    data: order,
  });
}