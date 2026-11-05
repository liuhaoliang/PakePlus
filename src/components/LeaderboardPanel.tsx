"use client";

import { openPageInAlipay } from "@/container";
import { useInAlipay } from "@/hooks/useInAlipay";
import { useProgress } from "@/hooks/useProgress";
import { Toast } from "antd-mobile";

/** 排行榜「我的名次」区块：本机成绩 + 登录同步引导（无真实后端，登录入口预留判定）。 */
export default function LeaderboardPanel() {
  const inAlipay = useInAlipay();
  const { progress, totalStars } = useProgress();
  const cleared = Object.values(progress).filter((p) => p.cleared).length;
  const totalScore = Object.values(progress).reduce((sum, p) => sum + (p.score ?? 0), 0);

  const openOrLogin = () => {
    if (inAlipay === false) {
      openPageInAlipay(window.location.href);
    } else {
      Toast.show({ content: "登录能力已预留：提交成绩/查看名次需要授权后同步（本期 mock）" });
    }
  };

  return (
    <div className="card">
      <div className="row between">
        <span style={{ fontWeight: 800 }}>我的名次</span>
        <span className="chip">本机成绩</span>
      </div>
      <div className="row" style={{ marginTop: 10, gap: 16 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>{totalStars}</div>
          <div className="muted">总星</div>
        </div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>{cleared}</div>
          <div className="muted">通关</div>
        </div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>{totalScore}</div>
          <div className="muted">总分</div>
        </div>
      </div>
      <button type="button" className="btn btn-primary btn-block btn-sm" style={{ marginTop: 12 }} onClick={openOrLogin}>
        {inAlipay === false ? "在支付宝中打开并登录同步" : "提交成绩并同步榜单"}
      </button>
    </div>
  );
}