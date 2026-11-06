// 头像色块（CSS 渲染，不落盘图片）：纯色圆角块 + 昵称首字符。
// 无 hooks，可同时用于 server/client。

export function AvatarBadge({ color, name, size = 40 }: { color: string; name: string; size?: number }) {
  const initial = name ? name.slice(0, 1) : "?";
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        color: "#fff",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: size * 0.5,
        flexShrink: 0,
      }}
    >
      {initial}
    </span>
  );
}