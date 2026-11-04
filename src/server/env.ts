// Server-only settings, read per request so a deployment can change them without a rebuild.

export type ProviderMode = "fixture" | "live";

// Fixtures need an explicit opt-in. Anything else is live, which fails loudly without a key.
export const providerMode = (): ProviderMode => (process.env.FIXFRAME_PROVIDER_MODE === "fixture" ? "fixture" : "live");

export const deploymentMetaKey = (): string | null => process.env.META_API_TOKEN?.trim() || null;

// About 4s for SAM and 25s for Muse Spark have been observed on the demo images.
const DEFAULT_META_TIMEOUT_MS = 60_000;

export const metaTimeoutMs = (): number => {
  const configured = Number(process.env.META_API_TIMEOUT_MS);
  return Number.isInteger(configured) && configured > 0 ? configured : DEFAULT_META_TIMEOUT_MS;
};

export const metaApiBaseUrl = (): string => (process.env.META_API_BASE_URL?.trim() || "https://api.meta.ai").replace(/\/+$/, "");
