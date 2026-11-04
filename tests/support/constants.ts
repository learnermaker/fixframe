// Fake token used only to prove it never leaks. It is not a credential.
export const SENTINEL_TOKEN = "FF_SENTINEL_TOKEN_do-not-leak-7f3a9c";

export const SCENARIOS = [
  { id: "water-ingress-01", location: "Level 2 / North corridor", assetLabel: "CEILING-ZONE-N2" },
  { id: "cable-sheath-02", location: "Training bench 04", assetLabel: "TRAINING-CABLE-04" },
  { id: "handrail-bracket-03", location: "Mock stairwell rig", assetLabel: "RAIL-FIXTURE-03" },
] as const;

// AGENT_WORKSTREAMS.md "Codes".
export const ERROR_CODES = [
  "UNCONFIGURED", "TIMEOUT", "RATE_LIMITED", "UPSTREAM_ERROR", "INVALID_RESPONSE", "UNSUPPORTED_INPUT", "SAFETY_REVIEW_REQUIRED",
] as const;
