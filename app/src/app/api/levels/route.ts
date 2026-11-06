import { NextResponse } from "next/server";
import { LEVELS } from "@/lib/mock/data";

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chapter = searchParams.get("chapter");
  const list = chapter ? LEVELS.filter((l) => l.chapter === Number(chapter)) : LEVELS;
  return NextResponse.json({ code: 0, message: "ok", data: list });
}