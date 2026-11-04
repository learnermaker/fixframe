import { deploymentMetaKey } from "../env";
import { fail, type ProviderResult } from "./types";

const USER_KEY_HEADER = "x-fixframe-meta-key";

/** ADR 0002: a user's key wins for this request, otherwise the deployment key. Used by both routes. */
export function resolveMetaKey(headers: Headers): ProviderResult<string> {
  const userKey = headers.get(USER_KEY_HEADER)?.trim();
  if (userKey) {
    // Checked here because an invalid header value would make fetch throw an error that can quote it.
    return /^[\x21-\x7e]+$/.test(userKey)
      ? { ok: true, value: userKey }
      : fail("UNSUPPORTED_INPUT", "The Meta API key you entered has characters a key cannot contain. Paste it again.");
  }
  const deploymentKey = deploymentMetaKey();
  return deploymentKey
    ? { ok: true, value: deploymentKey }
    : fail("UNCONFIGURED", "No Meta API key is configured on this server.");
}
