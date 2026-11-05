import { defineConfig } from "@apps-in-toss/web-framework/config";

/**
 * Apps in Toss mini-app config. `appName` must match the app registered in the
 * Apps in Toss console exactly (it also forms the intoss://{appName} deep link).
 * Build: `npm run build:toss` → static export in `out/` → `dearselly.ait`.
 */
export default defineConfig({
  appName: "dearselly",
  brand: {
    primaryColor: "#7EA47A",
  },
  navigationBar: {
    withBackButton: true,
    withHomeButton: false,
    withTitle: true,
    theme: "light",
  },
  webView: {
    allowsInlineMediaPlayback: true,
    bounces: false,
    pullToRefreshEnabled: false,
    overScrollMode: "never",
  },
  // "소리 내어 말하기" (self-compassion practice): voice level only, nothing recorded
  permissions: [{ name: "microphone", access: "access" }],
  webBundleDir: "out",
});
