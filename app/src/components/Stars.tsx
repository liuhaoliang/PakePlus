// 星级展示（★★☆），max 3。
export function Stars({ count, size = 16 }: { count: 0 | 1 | 2 | 3; size?: number }) {
  return (
    <span aria-label={`${count} 星`} style={{ color: "#FFB400", fontSize: size, letterSpacing: 1 }}>
      {"★".repeat(count)}
      <span style={{ color: "#E6D9C8" }}>{"★".repeat(3 - count)}</span>
    </span>
  );
}