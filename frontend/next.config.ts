import type { NextConfig } from "next";

// Rewrite fallback khi NEXT_PUBLIC_API_GATEWAY chưa set (same-origin /bff)
const gateway =
  process.env.API_GATEWAY_TARGET?.trim() || "http://127.0.0.1:5200";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/bff/oms/:path*",
        destination: `${gateway}/api/ordering/:path*`,
      },
      {
        source: "/bff/wms/:path*",
        destination: `${gateway}/api/warehouse/:path*`,
      },
    ];
  },
};

export default nextConfig;
