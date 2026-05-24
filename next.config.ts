import type { NextConfig } from "next";

const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const FRAME_DENY = { key: "X-Frame-Options", value: "DENY" };
const CSP_DENY_FRAME = {
  key: "Content-Security-Policy",
  value: "frame-ancestors 'none'",
};

const nextConfig: NextConfig = {
  devIndicators: false,
  async headers() {
    return [
      {
        source: "/widget",
        headers: [
          ...SECURITY_HEADERS,
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
        ],
      },
      {
        source: "/widget/:path*",
        headers: [
          ...SECURITY_HEADERS,
          // TODO(Phase 2 follow-up): replace wildcard with a per-tenant
          // allowed_origins jsonb column on tenants, served by middleware.
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
        ],
      },
      {
        // Negative lookahead so /widget keeps its embed-friendly CSP.
        source: "/:path((?!widget).*)",
        headers: [...SECURITY_HEADERS, FRAME_DENY, CSP_DENY_FRAME],
      },
    ];
  },
};

export default nextConfig;
