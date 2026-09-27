#!/usr/bin/env node
/**
 * Installs Magic UI components from the Tailwind CSS v3 registry (https://v3.magicui.design),
 * the same registry the shadcn CLI uses, without the interactive CLI.
 *
 *   npm run magicui:add                 # (re)install everything listed in scripts/magicui.json
 *   npm run magicui:add -- marquee      # add one more component (and remember it)
 *
 * Writes:  src/components/magicui/<name>.tsx
 *          src/components/magicui/tailwind-extend.json  (keyframes/animations merged into tailwind.config)
 * Then prints any npm packages you still need to install.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REGISTRY = "https://v3.magicui.design/r";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const listFile = join(root, "scripts", "magicui.json");
const outDir = join(root, "src", "components", "magicui");
const extendFile = join(outDir, "tailwind-extend.json");
// shadcn registry deps we provide ourselves (see src/lib/utils.ts, src/components/ui/button.tsx)
const PROVIDED = new Set(["utils", "button"]);

const list = JSON.parse(readFileSync(listFile, "utf8"));
const extra = process.argv.slice(2);
for (const name of extra) if (!list.includes(name)) list.push(name);
if (extra.length) writeFileSync(listFile, JSON.stringify(list.sort(), null, 2) + "\n");

mkdirSync(outDir, { recursive: true });
const extend = { keyframes: {}, animation: {} };
const deps = new Set();
const done = new Set();

function merge(target, src) {
  for (const [k, v] of Object.entries(src ?? {})) {
    target[k] = v && typeof v === "object" && !Array.isArray(v) ? merge(target[k] ?? {}, v) : v;
  }
  return target;
}

async function install(name) {
  if (done.has(name)) return;
  done.add(name);
  const res = await fetch(`${REGISTRY}/${name}.json`);
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  const item = await res.json();
  for (const d of item.dependencies ?? []) deps.add(d);
  for (const d of item.devDependencies ?? []) deps.add(d);
  for (const reg of item.registryDependencies ?? []) {
    if (PROVIDED.has(reg)) continue;
    const dep = reg.startsWith("http")
      ? reg
          .split("/")
          .pop()
          .replace(/\.json$/, "")
      : reg;
    await install(dep);
  }
  merge(extend, item.tailwind?.config?.theme?.extend);
  for (const file of item.files ?? []) {
    const base = file.path.split("/").pop();
    const content = file.content.replace(/^["']use client["'];?\s*\n/, "");
    const header = `// Magic UI – ${item.title ?? name} (${REGISTRY}/${name}.json). Vendored; edit freely.\n`;
    writeFileSync(join(outDir, base), header + content);
  }
  console.log(`✓ ${name}`);
}

for (const name of list) await install(name);
writeFileSync(extendFile, JSON.stringify(extend, null, 2) + "\n");

const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const have = { ...pkg.dependencies, ...pkg.devDependencies };
const missing = [...deps].filter((d) => !have[d]);
if (missing.length) console.log(`\nInstall missing packages:\n  npm install ${missing.join(" ")}`);
else console.log("\nAll Magic UI dependencies are installed.");
if (!existsSync(join(root, "src", "lib", "utils.ts")))
  console.log("Note: src/lib/utils.ts (cn) is required.");
