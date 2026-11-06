import { NextResponse } from "next/server";
import { getLevel, nextLevelId } from "@/lib/mock/data";

export function GET(_request: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const level = Number.isInteger(id) ? getLevel(id) : undefined;
  if (!level) {
    return NextResponse.json({ code: 404, message: "关卡不存在", data: null }, { status: 404 });
  }
  return NextResponse.json({ code: 0, message: "ok", data: { level, nextId: nextLevelId(id) } });
}