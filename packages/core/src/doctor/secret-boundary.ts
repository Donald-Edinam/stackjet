import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Public prefixes expose values to mobile code. They never make server credentials safe.
// Only client URLs and ingestion keys may use the public-prefix exception.
// Do not add /g, because test() would become stateful across files.
export const MOBILE_SECRET_PATTERN =
  /CLERK_SECRET_KEY|BETTER_AUTH_SECRET|SUPABASE_SERVICE_ROLE_KEY|DIRECT_DATABASE_URL|JWT_SECRET|JWT_REFRESH_SECRET|DATABASE_URL|POSTHOG_API_KEY|POSTHOG_SECRET|APTABASE_SECRET|SENTRY_AUTH_TOKEN|SENTRY_ORG|SENTRY_PROJECT|(?<!EXPO_PUBLIC_)(SUPABASE_URL|POSTHOG_KEY|APTABASE_KEY)/;

const skippedDirectories = new Set(["node_modules", ".expo", "dist", "dist-ios"]);

export function treeContains(directory: string, pattern: RegExp): boolean {
  if (!existsSync(directory)) return false;
  return readdirSync(directory, { withFileTypes: true }).some((entry) => {
    if (skippedDirectories.has(entry.name)) return false;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return treeContains(path, pattern);
    return (
      (/\.(?:ts|tsx|js|jsx|json)$/.test(entry.name) ||
        entry.name === ".env" ||
        entry.name.startsWith(".env.")) &&
      pattern.test(readFileSync(path, "utf8"))
    );
  });
}
