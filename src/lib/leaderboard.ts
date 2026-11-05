// 排行榜公开 mock（Top20 静态示例，字段按未来真实后端设计）
import type { LeaderboardEntry } from "./types";

export const LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, nickname: "弹弓大师老王", avatar: "/images/avatar/a01.svg", totalStars: 60, score: 1284000 },
  { rank: 2, nickname: "三颗星猎人", avatar: "/images/avatar/a02.svg", totalStars: 60, score: 1250100 },
  { rank: 3, nickname: "清晨的弹珠", avatar: "/images/avatar/a03.svg", totalStars: 59, score: 1198000 },
  { rank: 4, nickname: "阿火的应援团", avatar: "/images/avatar/a04.svg", totalStars: 57, score: 1103200 },
  { rank: 5, nickname: "软泥怪克星", avatar: "/images/avatar/a05.svg", totalStars: 55, score: 1045000 },
  { rank: 6, nickname: "星语心愿", avatar: "/images/avatar/a06.svg", totalStars: 52, score: 986000 },
  { rank: 7, nickname: "一只小弹珠", avatar: "/images/avatar/a07.svg", totalStars: 48, score: 874000 },
  { rank: 8, nickname: "云端射手", avatar: "/images/avatar/a08.svg", totalStars: 46, score: 812000 },
  { rank: 9, nickname: "迷宫里的猫", avatar: "/images/avatar/a09.svg", totalStars: 44, score: 765000 },
  { rank: 10, nickname: "卡在第五关", avatar: "/images/avatar/a10.svg", totalStars: 15, score: 232000 },
  { rank: 11, nickname: "首富不是梦", avatar: "/images/avatar/a11.svg", totalStars: 14, score: 218000 },
  { rank: 12, nickname: "今天也要三星", avatar: "/images/avatar/a12.svg", totalStars: 13, score: 201000 },
  { rank: 13, nickname: "弹无虚发", avatar: "/images/avatar/a13.svg", totalStars: 12, score: 187000 },
  { rank: 14, nickname: "躺平打弹珠", avatar: "/images/avatar/a14.svg", totalStars: 11, score: 166000 },
  { rank: 15, nickname: "桃子汽水", avatar: "/images/avatar/a15.svg", totalStars: 10, score: 154000 },
  { rank: 16, nickname: "老板别抓我摸鱼", avatar: "/images/avatar/a16.svg", totalStars: 9, score: 132000 },
  { rank: 17, nickname: "地铁里手滑", avatar: "/images/avatar/a17.svg", totalStars: 8, score: 118000 },
  { rank: 18, nickname: "只为通关", avatar: "/images/avatar/a18.svg", totalStars: 7, score: 99000 },
  { rank: 19, nickname: "星尘骑士", avatar: "/images/avatar/a19.svg", totalStars: 6, score: 84000 },
  { rank: 20, nickname: "我是来看攻略的", avatar: "/images/avatar/a20.svg", totalStars: 5, score: 70000 },
];