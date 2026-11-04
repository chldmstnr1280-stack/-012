import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dear Selly · 디어셀리",
    short_name: "디어셀리",
    description: "나를 돌보는, 작은 웰니스 정원 — Held, not healed.",
    lang: "ko",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fdfbf6",
    theme_color: "#f6eedb",
    categories: ["health", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "오늘의 기록", url: "/record", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "호흡하기", url: "/?do=breathe", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "생리주기", url: "/calendar", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
