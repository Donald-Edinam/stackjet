import type { SupportedSdk } from "@expojet/schemas";

/**
 * SDK-pinned dependency versions. Packages whose version tracks the Expo SDK
 * major (e.g. expo-haptics ~57.x → ~58.x) are listed here so adapters resolve
 * the correct version at plan time.
 */
const sdkVersions: Record<SupportedSdk, Record<string, string>> = {
  57: {
    "expo-auth-session": "~57.0.12",
    "expo-crypto": "~57.0.3",
    "expo-web-browser": "~57.0.3",
    "expo-haptics": "~57.0.3",
    "expo-sqlite": "~57.0.3",
    "expo-font": "~57.0.4",
    "expo-asset": "~57.0.18",
    "expo-glass-effect": "~57.0.3",
    "expo-blur": "~57.0.2",
  },
  58: {
    "expo-auth-session": "~58.0.0",
    "expo-crypto": "~58.0.0",
    "expo-web-browser": "~58.0.0",
    "expo-haptics": "~58.0.0",
    "expo-sqlite": "~58.0.0",
    "expo-font": "~58.0.0",
    "expo-asset": "~58.0.0",
    "expo-glass-effect": "~58.0.0",
    "expo-blur": "~58.0.0",
  },
};

export function sdkVersion(sdk: SupportedSdk, pkg: string): string {
  const version = sdkVersions[sdk]?.[pkg];
  if (!version) {
    throw new Error(`No SDK-pinned version for "${pkg}" on SDK ${sdk}`);
  }
  return version;
}
