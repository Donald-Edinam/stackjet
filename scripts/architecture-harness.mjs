/**
 * Hash generated files for 64 selected representative configurations.
 * This checks content and file names, not every supported combination or runtime behavior.
 * Run through pnpm architecture or pnpm architecture:check to build the CLI first.
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const baselinePath = join(root, "architecture.baseline.json");

/** The buildCreatePlan + materializePlan bundle, built by tsup from packages/cli. */
const generationEntry = join(root, "packages/cli/dist/generation.js");

const args = new Set(process.argv.slice(2));
const checkOnly = args.has("--check");
const verbose = args.has("--verbose");

if (!existsSync(generationEntry)) {
  console.error(
    `Missing ${generationEntry}\nRun \`pnpm build\` (or \`pnpm --filter create-expojet build\`) first.`,
  );
  process.exit(1);
}

const { buildCreatePlan, createInputSchema, materializePlan } = await import(pathToFileURL(generationEntry).href);

/** Dimensions used by the selected scenarios below. */
const styles = ["uniwind", "nativewind", "unistyles", "stylesheet"];
const iconLibraries = ["lucide", "hugeicons", "expo"];
const stateAdapters = ["none", "zustand", "mobx"];
const analyticsAdapters = ["none", "posthog", "aptabase"];
const monitoringAdapters = ["none", "sentry"];

const base = {
  projectName: "probe-app",
  destination: "/harness/probe",
  structure: "standalone",
  packageManager: "pnpm",
  auth: "clerk",
  style: "uniwind",
  onboarding: true,
  darkMode: true,
  haptics: true,
  eas: true,
  typescript: true,
  liquidGlass: true,
  socialProviders: [],
  sdk: 57,
};

/** Named scenarios, each a delta from {@link base}. Kept readable because failures name a case. */
const scenarios = [
  ["default/standalone", {}],
  ["default/monorepo", { structure: "monorepo" }],
  ["default/monorepo-web", { structure: "monorepo-web" }],

  ["sdk/57", { sdk: 57 }],
  ["sdk/58", { sdk: 58 }],

  ["nav/router-tabs", { navigation: "router", navigationType: "tabs" }],
  ["nav/router-drawer", { navigation: "router", navigationType: "drawer" }],
  ["nav/router-both", { navigation: "router", navigationType: "both" }],
  ["nav/router-stack", { navigation: "router", navigationType: "stack" }],
  ["nav/reactnav-tabs", { navigation: "react-navigation", navigationType: "tabs", liquidGlass: false }],
  ["nav/reactnav-drawer", { navigation: "react-navigation", navigationType: "drawer" }],
  ["nav/reactnav-both", { navigation: "react-navigation", navigationType: "both", liquidGlass: false }],
  ["nav/reactnav-stack", { navigation: "react-navigation", navigationType: "stack" }],
  ["nav/reactnav-both-glass", { navigation: "react-navigation", navigationType: "both", liquidGlass: false }],

  ["structure/monorepo-nav-both", { structure: "monorepo", navigation: "router", navigationType: "both" }],
  ["structure/monorepo-web-nav-both", { structure: "monorepo-web", navigation: "router", navigationType: "both" }],

  ...styles.map((style) => [`style/${style}`, { style }]),
  ...styles.map((style) => [`style/${style}-monorepo`, { style, structure: "monorepo" }]),

  ...iconLibraries.map((icons) => [`icons/${icons}`, { icons }]),
  ...stateAdapters.map((state) => [`state/${state}`, { state }]),
  ...analyticsAdapters.map((analytics) => [`analytics/${analytics}`, { analytics }]),
  ...monitoringAdapters.map((monitoring) => [`monitoring/${monitoring}`, { monitoring }]),

  ["backend/convex-standalone", { backend: "convex" }],
  ["backend/convex-monorepo", { structure: "monorepo", backend: "convex" }],
  ["backend/hono", { structure: "monorepo", backend: "hono" }],
  ["backend/express", { structure: "monorepo", backend: "express" }],
  ["backend/nestjs", { structure: "monorepo", backend: "nestjs" }],

  ["db/neon-drizzle", { structure: "monorepo", backend: "hono", database: "neon", orm: "drizzle" }],
  ["db/postgres-drizzle", { structure: "monorepo", backend: "hono", database: "postgres", orm: "drizzle" }],
  ["db/postgres-prisma", { structure: "monorepo", backend: "hono", database: "postgres", orm: "prisma" }],
  ["db/sqlite-drizzle", { structure: "monorepo", backend: "hono", database: "sqlite", orm: "drizzle" }],
  ["db/supabase-drizzle", { structure: "monorepo", backend: "hono", database: "supabase", orm: "drizzle" }],
  ["db/supabase-prisma", { structure: "monorepo", backend: "hono", database: "supabase", orm: "prisma" }],

  ["auth/clerk", { auth: "clerk" }],
  ["auth/clerk-socials", { auth: "clerk", socialProviders: ["google", "apple", "facebook"] }],
  ["auth/none", { auth: "none" }],
  ["auth/supabase", { structure: "monorepo", backend: "hono", auth: "supabase" }],
  ["auth/firebase", { auth: "firebase" }],
  ["auth/better-auth", { structure: "monorepo", backend: "hono", auth: "better-auth", database: "neon", orm: "drizzle" }],

  ["pm/pnpm", { packageManager: "pnpm" }],
  ["pm/npm", { packageManager: "npm" }],
  ["pm/bun", { packageManager: "bun" }],
  ["pm/yarn", { packageManager: "yarn" }],
  ["pm/yarn-sdk58", { packageManager: "yarn", sdk: 58 }],

  ["feature/eas-off", { eas: false }],
  ["feature/dark-off", { darkMode: false }],
  ["feature/haptics-off", { haptics: false }],
  ["feature/onboarding-off", { onboarding: false }],
  ["feature/glass-off", { liquidGlass: false }],
  ["feature/all-off", { eas: false, darkMode: false, haptics: false, onboarding: false, liquidGlass: false }],

  [
    "kitchen-sink/monorepo-web",
    {
      structure: "monorepo-web",
      sdk: 58,
      navigation: "router",
      navigationType: "both",
      auth: "clerk",
      socialProviders: ["google", "apple", "facebook", "microsoft"],
      style: "nativewind",
      icons: "hugeicons",
      state: "zustand",
      backend: "hono",
      database: "neon",
      orm: "drizzle",
      analytics: "posthog",
      monitoring: "sentry",
      packageManager: "bun",
    },
  ],
];

const hash = (value) => createHash("sha256").update(value).digest("hex").slice(0, 16);

const results = {};
const rejected = [];

for (const [name, delta] of scenarios) {
  const candidate = { ...base, ...delta, destination: `/harness/${name.replaceAll("/", "-")}` };
  const parsed = createInputSchema.safeParse(candidate);
  if (!parsed.success) {
    rejected.push({ name, issues: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) });
    continue;
  }

  const files = materializePlan(buildCreatePlan(parsed.data));
  // Sorting makes the fingerprint independent of the order operations happen to run in, so only a
  // real content or file-set change shows up as drift.
  const sorted = [...files].sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  results[name] = {
    fileCount: sorted.length,
    treeHash: hash(sorted.map((f) => `${f.path}\0${hash(f.content)}`).join("\n")),
  };
}

const manifest = {
  $comment:
    "Generated by scripts/architecture-harness.mjs. Do not edit by hand. " +
    "Regenerate with `node scripts/architecture-harness.mjs` when a change to generated output is intentional.",
  generator: hash(readFileSync(generationEntry, "utf8").slice(0, 4096)),
  scenarios: Object.keys(results).length,
  results,
};

if (verbose) {
  for (const [name, r] of Object.entries(results)) {
    console.log(`  ${name.padEnd(38)} ${String(r.fileCount).padStart(4)} files  ${r.treeHash}`);
  }
}

// Every scenario must be accepted. A rejection here means the harness and the schema disagree,
// which is itself an architectural finding rather than something to tolerate.
if (rejected.length > 0) {
  console.error(`\n${rejected.length} scenario(s) were rejected by the create schema:`);
  for (const { name, issues } of rejected) {
    console.error(`  ${name}`);
    for (const issue of issues) console.error(`      ${issue}`);
  }
  process.exit(1);
}

if (checkOnly) {
  if (!existsSync(baselinePath)) {
    console.error(`\nNo baseline at ${baselinePath}. Run without --check to create one.`);
    process.exit(1);
  }
  const baseline = JSON.parse(readFileSync(baselinePath, "utf8"));
  const drift = [];

  for (const name of new Set([...Object.keys(baseline.results), ...Object.keys(results)])) {
    const before = baseline.results[name];
    const after = results[name];
    if (!before) drift.push({ name, kind: "added" });
    else if (!after) drift.push({ name, kind: "removed" });
    else if (before.treeHash !== after.treeHash) {
      drift.push({
        name,
        kind: "changed",
        before: `${before.fileCount} files ${before.treeHash}`,
        after: `${after.fileCount} files ${after.treeHash}`,
      });
    }
  }

  if (drift.length === 0) {
    console.log(
      `architecture: ${Object.keys(results).length} scenarios unchanged against ${baselinePath.replace(`${root}/`, "")}`,
    );
    process.exit(0);
  }

  console.error(`\narchitecture drift in ${drift.length} scenario(s):\n`);
  for (const d of drift) {
    if (d.kind === "changed") {
      console.error(`  ~ ${d.name}\n      before ${d.before}\n      after  ${d.after}`);
    } else {
      console.error(`  ${d.kind === "added" ? "+" : "-"} ${d.name}`);
    }
  }
  console.error(
    "\nIf this change to generated output is intended, regenerate with:\n" +
      "  node scripts/architecture-harness.mjs",
  );
  process.exit(1);
}

mkdirSync(dirname(baselinePath), { recursive: true });
writeFileSync(baselinePath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(
  `wrote ${Object.keys(results).length} scenarios to ${baselinePath.replace(`${root}/`, "")}`,
);
