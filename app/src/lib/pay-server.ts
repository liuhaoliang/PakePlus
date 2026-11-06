// 支付（服务端专用）——手机网站支付 wap.pay 预留。
// 公网能力源：opendocs.alipay.com /open/203/107091。
// 本期不实接（需企业 AppId/应用私钥，任务未提供）：返回占位订单 + 提示「即将上线」。
// 注意：服务端密钥只读服务端 env，绝不使用 NEXT_PUBLIC_ 前缀；前端一律走 location.assign(wapPayUrl)，
// 不使用 ap.tradePay（公网无第三方 H5 版）。

import { randomUUID } from "node:crypto";

export interface OrderResult {
  tradeNo: string;
  amount: string;
  subject: string;
  redirectUrl: string;
  status: "created" | "paying" | "paid" | "failed";
}

const CACHE = new Map<string, OrderResult>();

export function createOrder(subject: string, amount: string): OrderResult {
  const order: OrderResult = {
    tradeNo: `T${Date.now()}${randomUUID().slice(0, 8).replace(/-/g, "")}`,
    amount,
    subject,
    // 真实环境：调用服务端 SDK 生成 alipay.trade.wap.pay 跳转 URL；本期占位。
    redirectUrl: "",
    status: "created",
  };
  CACHE.set(order.tradeNo, order);
  return order;
}

export function getOrder(tradeNo: string): OrderResult | undefined {
  return CACHE.get(tradeNo);
}

/**
 * 生成 wap.pay 跳转 URL（真实环境）。
 * 依赖服务端 env：ALIPAY_APP_ID / ALIPAY_PRIVATE_KEY / ALIPAY_GATEWAY。
 * 本期返回空字符串占位，由路由层统一告知「即将上线」。
 */
export function buildWapPayUrl(_order: OrderResult): string {
  return "";
}