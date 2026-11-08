import type { NextConfig } from "next";

const isToss = process.env.NEXT_PUBLIC_PLATFORM === "toss";

const nextConfig: NextConfig = {
  devIndicators: false,
  // `*.server.ts` files (the /api/whine POST route) exist only in the web
  // build — a static export can't serve POST handlers, and the Toss build
  // answers with built-in replies on the device.
  pageExtensions: isToss ? ["tsx", "ts", "jsx", "js"] : ["tsx", "ts", "jsx", "js", "server.ts"],
  // Apps in Toss: no SSR — a static export (SSG) uploaded as a .ait bundle
  ...(isToss ? { output: "export" as const, trailingSlash: true, images: { unoptimized: true } } : {}),
  // headers() doesn't apply to a static export, so it's only set for the web build
  ...(isToss
    ? {}
    : {
        async headers() {
          return [
            {
              source: "/sw.js",
              headers: [
                { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
                { key: "Content-Type", value: "application/javascript; charset=utf-8" },
              ],
            },
          ];
        },
      }),
  // static export can't prerender partially: off for the Toss build only
  cacheComponents: !isToss,
  partialPrefetching: !isToss,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
