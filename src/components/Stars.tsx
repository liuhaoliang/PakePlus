/** 星级展示（纯展示组件，服务端/客户端均可用）。 */
export default function Stars({ count, max = 3 }: { count: number; max?: number }) {
  const filled = Math.max(0, Math.min(max, Math.round(count)));
  return (
    <span className="stars" role="img" aria-label={`${filled} 星`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < filled ? "" : "dim"} aria-hidden>
          ★
        </span>
      ))}
    </span>
  );
}