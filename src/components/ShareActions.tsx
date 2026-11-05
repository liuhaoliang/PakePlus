"use client";

import { copyText } from "@/container";
import { useRouter } from "next/navigation";
import { Toast } from "antd-mobile";
import OpenAlipayButton from "./OpenAlipayButton";

/** 分享落地页 CTA：立即挑战 + 复制链接 + 打开支付宝。 */
export default function ShareActions({ levelId }: { levelId: string }) {
  const router = useRouter();

  const copy = async () => {
    const ok = await copyText(window.location.href);
    Toast.show({ content: ok ? "链接已复制" : "复制失败，请手动复制" });
  };

  return (
    <div className="cta-stack">
      <button type="button" className="btn btn-primary btn-block" onClick={() => router.push(`/play/${levelId}`)}>
        立即挑战
      </button>
      <button type="button" className="btn btn-ghost btn-block" onClick={copy}>
        复制链接
      </button>
      <div className="row" style={{ justifyContent: "center" }}>
        <OpenAlipayButton />
      </div>
    </div>
  );
}