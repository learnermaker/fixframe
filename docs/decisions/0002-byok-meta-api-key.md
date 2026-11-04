# ADR 0002 — Bring Your Own Meta API Key

Status: **accepted by maintainer** on 2026-11-04.

## Context

FixFrame must work in deployments where the operator has not configured a Meta API key as a server environment variable. A demo user may optionally provide their own Meta API key (BYOK) to enable live SAM 3.1 and Muse Spark requests.

## Decision

Support two credential sources:

1. **Deployment credential:** server-side `META_API_TOKEN` environment variable.
2. **User-provided credential:** optional key entered in the FixFrame UI and supplied for the current live request.

When a user-provided key is present, it takes precedence for that request. Otherwise, use the deployment credential. If neither is available, return the existing `UNCONFIGURED` error and explain that the user can configure a key or select explicit fixture mode.

Fixture mode remains an explicit provider mode. A missing key or failed live call must never silently switch to fixtures.

## Required security behaviour

- The key input is password-masked and has an explicit **Use for this session** / clear control.
- Keep the key in client memory only. Do not put it in localStorage, sessionStorage, IndexedDB, cookies, URL/query strings, analytics, React server props, or persisted application state.
- Send it only in a dedicated request header from the browser to the same-origin FixFrame API route (recommended name: `X-FixFrame-Meta-Key`). Never send it directly from the browser to Meta.
- The route handler selects the per-request key, then sends it to Meta as the upstream bearer credential. Never return it to the browser.
- Never log request headers, the key, upstream Authorization headers, or raw provider request objects that could contain credentials. Redact the header in error reporting.
- Do not persist, cache, or retain user keys server-side beyond the in-flight request. Do not create a user account or key vault for this prototype.
- Use HTTPS in deployed environments. Explain in the UI that a BYOK key is transmitted to the FixFrame server for forwarding to Meta and is not stored by FixFrame; do not claim end-to-end secrecy from the server operator.
- Do not include a key in generated screenshots, recordings, console output, test snapshots, or demo fixtures. Use a fake sentinel value in security tests.
- Keep `META_API_TOKEN` server-only. Never use a `NEXT_PUBLIC_*` variable for provider credentials.

## API and precedence

- Frontend sends `X-FixFrame-Meta-Key` only when the user has entered a key.
- Server helper resolves `requestKey ?? process.env.META_API_TOKEN`, after trimming and validating non-empty input.
- The helper must not mutate process environment variables to support per-user credentials.
- Both `/api/segment` and `/api/extract` must use the same credential resolution and redaction helper.
- If the user key is malformed or rejected by Meta, return a clear provider error. Do not retry using the deployment key; that could unexpectedly charge/use a different account.
- If no key is available, return `UNCONFIGURED`; fixture mode is available only when explicitly selected.

## Acceptance tests

- No deployment key + no BYOK key in live mode returns `UNCONFIGURED`.
- No deployment key + valid mocked BYOK key forwards that key upstream and returns normalized output.
- Deployment key + no BYOK key uses the deployment key.
- Both keys present uses the BYOK key for that request only.
- A rejected BYOK key returns an error and does not fall back to the deployment key or fixtures.
- The BYOK key is absent from HTML, JS bundles, API responses, logs, URLs, storage, and error messages.
- Clearing the field removes it from subsequent requests.
- A page refresh clears the BYOK key.
- Fixture mode remains explicit and does not use either credential.

## Consequences

BYOK makes live mode possible on deployments without a shared server key, while keeping the Meta credential out of the browser-to-Meta path. The FixFrame server necessarily receives the user-provided key in order to forward it; the UI must disclose this. This is a prototype session-only mechanism, not a secure credential vault or account system.
