import type { SdkPackManifest } from "@expojet/schemas";
import { sdk58FilesSha256 } from "./template.generated.js";

export { sdk58Files, sdk58FilesSha256 } from "./template.generated.js";

export const sdk58Manifest = {
  $schema: "../../schemas/sdk-pack.schema.json",
  sdk: 58 as const,
  status: "stable" as const,
  source: {
    kind: "create-expo-app" as const,
    template: "default@sdk-58",
    syncedAt: "2026-09-27T00:00:00.000Z",
  },
  supportedPackageManagers: ["pnpm", "npm", "bun"] as const,
  newArchitecture: true,
  checks: ["typecheck", "test", "expo-doctor", "expo-export"] as const,
  filesSha256: sdk58FilesSha256,
} satisfies SdkPackManifest;
