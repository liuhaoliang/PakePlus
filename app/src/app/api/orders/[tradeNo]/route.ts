import { NextResponse } from "next/server";
import { getOrder } from "@/lib/pay-server";

// 查询订单/支付结果（预留）。
export function GET(_request: Request, { params }: { params: { tradeNo: string } }) {
  const order = getOrder(params.tradeNo);
  if (!order) {
    return NextResponse.json({ code: 404, message: "订单不存在", data: null }, { status: 404 });
  }
  return NextResponse.json({ code: 0, message: "ok", data: order });
}