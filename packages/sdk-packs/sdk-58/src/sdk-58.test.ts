import { createHash } from "node:crypto";
import { sdkPackManifestSchema } from "@expojet/schemas";
import { describe, expect, it } from "vitest";
import { sdk58Files, sdk58FilesSha256, sdk58Manifest } from "./index.js";

function hashFiles(files: Readonly<Record<string, string>>) {
  const hash = createHash("sha256");
  for (const [path, content] of Object.entries(files).sort(([left], [right]) =>
    left.localeCompare(right),
  )) {
    hash.update(path);
    hash.update("\0");
    hash.update(content);
    hash.update("\0");
  }
  return hash.digest("hex");
}

describe("SDK 58 pack", () => {
  it("embeds a checksum-verified immutable template", () => {
    expect(sdk58Manifest.sdk).toBe(58);
    expect(sdkPackManifestSchema.parse(sdk58Manifest)).toEqual(sdk58Manifest);
    expect(Object.isFrozen(sdk58Files)).toBe(true);
    expect(hashFiles(sdk58Files)).toBe(sdk58FilesSha256);
  });

  it("contains the standalone Expo foundation", () => {
    expect(Object.keys(sdk58Files)).toEqual(
      expect.arrayContaining(["package.json", "app.json", "app/_layout.tsx", "app/index.tsx"]),
    );
  });

  it("mounts the theme globally and prioritizes onboarding before auth", () => {
    const layout = sdk58Files["app/_layout.tsx"];
    const index = sdk58Files["app/index.tsx"];
    if (!layout || !index) throw new Error("SDK template routes are missing");

    expect(layout).toContain('import { ThemeProvider } from "../src/theme/provider";');
    expect(layout).toContain("<ThemeProvider>");
    expect(index).toContain(
      'if (features.onboarding && !onboarding.complete) return <Redirect href="/(onboarding)" />;',
    );
    expect(index.indexOf("features.onboarding")).toBeLessThan(
      index.indexOf('session.status === "unauthenticated"'),
    );
  });
});
