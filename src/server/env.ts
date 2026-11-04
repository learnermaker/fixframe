// Server-only settings, read per request so a deployment can change them without a rebuild.

export type ProviderMode = "fixture" | "live";

// Fixtures need an explicit opt-in. Anything else is live, which fails loudly without a key.
export const providerMode = (): ProviderMode => (process.env.FIXFRAME_PROVIDER_MODE === "fixture" ? "fixture" : "live");

export const deploymentMetaKey = (): string | null => process.env.META_API_TOKEN?.trim() || null;

export const metaApiBaseUrl = (): string => (process.env.META_API_BASE_URL?.trim() || "https://api.meta.ai").replace(/\/+$/, "");
