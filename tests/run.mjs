// Runs every tests/*.test.ts with tsx and fails if any test fails.
// Usage: npm test   (or: node tests/run.mjs pms jitai — only matching files)
import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const only = process.argv.slice(2);
const files = readdirSync(dir)
  .filter((f) => f.endsWith(".test.ts"))
  .filter((f) => !only.length || only.some((o) => f.includes(o)))
  .sort();

let failed = 0;
for (const f of files) {
  const r = spawnSync("npx", ["--yes", "tsx@4.23.13", join(dir, f)], { cwd: join(dir, ".."), encoding: "utf8" });
  const out = `${r.stdout ?? ""}${r.stderr ?? ""}`.trim();
  const bad = r.status !== 0 || /FAIL|failures/.test(out);
  if (bad) failed++;
  const last = out.split("\n").filter(Boolean).pop() ?? "";
  console.log(`${bad ? "✗" : "✓"} ${f.padEnd(26)} ${bad ? "\n" + out : last}`);
}
console.log(`\n${files.length - failed}/${files.length} test files passed`);
process.exit(failed ? 1 : 0);
