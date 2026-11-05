// 攻略内容（1 篇真实图文，公开可收录）
import type { Guide } from "./types";

export const GUIDES: Guide[] = [
  {
    slug: "slingshot-tips",
    title: "弹弓小队：从零到三星的通关手感",
    abstract: "力度、弹道预判与三星要点，一篇文章讲透。",
    cover: "/images/guide/cover-16x9.webp",
    date: "2026-11-01",
    sections: [
      {
        heading: "先学会看轨迹虚线",
        body: "拖得越远弹力越大，虚线末端的落点就是你命中点。先瞄底部支撑，再考虑连锁倒塌——打垮一层横梁，上面的软泥怪会跟着摔下来。",
        image: "/images/guide/aim-16x9.webp",
      },
      {
        heading: "三星要点：省弹珠 + 速拆",
        body: "剩余弹珠有分，一颗弹珠清场比三颗清场分数高一个量级。优先击打堡垒底角，用一次坍塌带走整个结构，而不是逐块敲。",
        image: "/images/guide/stars-16x9.webp",
      },
      {
        heading: "不同材质的拆法",
        body: "木头用撞、玻璃用穿、石头要垫高处让重力帮忙、铁块尽量避开只打软泥怪。记住了，堡垒是为你准备的积木，弹珠才是拆积木的手。",
        image: "/images/guide/material-16x9.webp",
      },
    ],
    relatedLevels: ["lv-01", "lv-03", "lv-06"],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}