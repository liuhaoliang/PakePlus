/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 编码阶段以 tsc/构建为准；eslint 单独跑（不影响构建门禁）
  eslint: { ignoreDuringBuilds: true },
  images: { formats: ["image/webp"] },
  poweredByHeader: false,
  // 公网部署允许导出；后续真实域名通过 env 注入
  experimental: {},
};

export default nextConfig;