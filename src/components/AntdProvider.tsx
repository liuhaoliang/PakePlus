"use client";

import { ConfigProvider } from "antd-mobile";
import zhCN from "antd-mobile/es/locales/zh-CN";

/** antd-mobile 中文环境（Toast/Dialog 等文案用中文）。 */
export default function AntdProvider({ children }: { children: React.ReactNode }) {
  return <ConfigProvider locale={zhCN}>{children}</ConfigProvider>;
}