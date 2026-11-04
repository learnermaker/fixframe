import type { ProviderError } from "../lib/contracts";

const GUIDANCE: Record<ProviderError["code"], { title: string; next: string }> = {
  UNCONFIGURED: { title: "No Meta API key is available", next: "Add a key for this session, or restart the server in fixture mode." },
  TIMEOUT: { title: "The provider did not answer in time", next: "Retry, or try again shortly." },
  RATE_LIMITED: { title: "The provider is limiting requests", next: "Wait a moment, then retry." },
  UPSTREAM_ERROR: { title: "The provider returned an error", next: "Retry. If it keeps failing, check the provider status." },
  INVALID_RESPONSE: { title: "The response failed validation", next: "Nothing from it was used. Retry to request a new result." },
  UNSUPPORTED_INPUT: { title: "The input is not supported", next: "Change the input, then retry." },
  SAFETY_REVIEW_REQUIRED: { title: "The output contained a disallowed claim", next: "It was not used. Retry to request a new result." },
};

export function ErrorNotice({ error, onRetry }: { error: ProviderError; onRetry?: () => void }) {
  const { title, next } = GUIDANCE[error.code];
  return (
    <div role="alert" className="border-l-4 border-alarm bg-panel p-3 text-sm">
      <p className="font-semibold text-alarm">{title}</p>
      <p>{error.message}</p>
      <p className="text-slate">{next} No demo data was substituted.</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="mt-2 border border-graphite px-3 py-1 font-medium hover:bg-concrete">
          Retry
        </button>
      )}
    </div>
  );
}
