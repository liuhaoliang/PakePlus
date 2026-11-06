"use client";

import { Collapse } from "antd-mobile";
import type { FaqItem } from "@/lib/types";

/** FAQ 手风琴（客户端交互）。内容文字已由服务端以 FAQPage 结构化数据直出进 HTML。 */
export function FaqAccordion({ items }: { items: FaqItem[] }) {
  return (
    <Collapse>
      {items.map((f) => (
        <Collapse.Panel key={f.question} title={f.question}>
          {f.answer}
        </Collapse.Panel>
      ))}
    </Collapse>
  );
}