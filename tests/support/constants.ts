// Fake values used only to prove they never leak. They are not credentials.
export const SENTINEL_TOKEN = "FF_SENTINEL_TOKEN_do-not-leak-7f3a9c"; // plays the deployment META_API_TOKEN
export const SENTINEL_BYOK = "FF_SENTINEL_BYOK_do-not-leak-4d81e2"; // plays a user-entered key (ADR 0002)

export const BYOK_HEADER = "X-FixFrame-Meta-Key"; // ADR 0002 recommended name

// Trusted catalog and error codes come from Workstream C's modules (not re-declared here).
export { SCENARIOS } from "../../src/data/scenarios";
export { PROVIDER_ERROR_CODES as ERROR_CODES } from "../../src/lib/contracts";
