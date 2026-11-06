/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 素材为本地原创 WebP/SVG，已按设计稿优化，无需 next/image 二次压缩（也避免依赖 sharp）。
  images: { unoptimized: true },
  // lint 与 typecheck 保留在 CI 单独执行，避免发布构建被风格告警阻塞。
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;