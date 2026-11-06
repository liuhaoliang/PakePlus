"use client";

import { useEffect, useState } from "react";
import { Toast } from "antd-mobile";
import { isAlipayClient, openPageInAlipay, shareLink } from "@/container/container";
import { isFavorited, setFavorited } from "@/lib/storage";

/** 首页·分享/打开引导：浏览器→唤起支付宝；App 内→复制/系统分享链接；收藏写 localStorage。 */
export function ShareFavActions({ url }: { url: string }) {
  const [inAlipay, setInAlipay] = useState<boolean | null>(null);
  const [fav, setFav] = useState<boolean | null>(null);

  useEffect(() => {
    setInAlipay(isAlipayClient());
    setFav(isFavorited());
  }, []);

  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      {inAlipay === false ? (
        <button className="btn btn-primary" type="button" onClick={() => openPageInAlipay(url)}>
          用支付宝打开
        </button>
      ) : inAlipay === true ? (
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => {
            void shareLink(url, "来和我一起玩弹弹鸟,击倒猪堡保卫鸟蛋!").then((r) => {
              Toast.show({ content: r === "shared" ? "已唤起分享" : "已复制链接" });
            });
          }}
        >
          分享给好友
        </button>
      ) : null}
      <button
        className="btn btn-ghost"
        type="button"
        onClick={() => {
          const next = !(fav ?? false);
          setFav(next);
          setFavorited(next);
          Toast.show({ content: next ? "已收藏,下次从浏览记录进" : "已取消收藏" });
        }}
      >
        {fav ? "已收藏" : "收藏本站"}
      </button>
    </div>
  );
}