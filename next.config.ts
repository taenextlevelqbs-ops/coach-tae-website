import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/qb-lab/sw.js", headers: [
      { key: "Service-Worker-Allowed", value: "/qb-lab" },
      { key: "Content-Type", value: "application/javascript; charset=utf-8" },
      { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
      { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
    ] }];
  },
};

export default nextConfig;
