"use client";

import { useState } from "react";

type Props = {
  providerMode: "fixture" | "live";
  hasDeploymentKey: boolean;
  sessionKeySet: boolean;
  onUseKey: (key: string) => void;
  onClearKey: () => void;
};

export function ProviderPanel({ providerMode, hasDeploymentKey, sessionKeySet, onUseKey, onClearKey }: Props) {
  const [draft, setDraft] = useState("");

  if (providerMode === "fixture") {
    return (
      <section aria-label="Provider" className="max-w-sm text-sm">
        <p className="font-semibold">Fixture mode</p>
        <p className="text-slate">Results come from files in this repository. No AI model is called and no key is needed.</p>
      </section>
    );
  }

  return (
    <section aria-label="Provider" className="max-w-md text-sm">
      <p className="font-semibold">Live mode</p>
      <p className="text-slate">
        {sessionKeySet
          ? "Requests use the key you added, for this session only."
          : hasDeploymentKey
            ? "Requests use this deployment's key. A key you add replaces it for this session."
            : "This deployment has no key. Add your own to run requests."}
      </p>
      <form
        className="mt-2 flex flex-wrap items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!draft.trim()) return;
          onUseKey(draft.trim());
          setDraft("");
        }}
      >
        <label className="grow">
          <span className="block font-medium">Meta API key</span>
          <input
            type="password"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            data-1p-ignore
            data-lpignore="true"
            placeholder={sessionKeySet ? "Key set for this session" : ""}
            className="w-full border border-rule bg-panel px-2 py-1"
          />
        </label>
        <button type="submit" disabled={!draft.trim()} className="border border-graphite px-3 py-1 font-medium hover:bg-panel disabled:opacity-50">
          Use for this session
        </button>
        <button
          type="button"
          disabled={!sessionKeySet && !draft}
          onClick={() => {
            setDraft("");
            onClearKey();
          }}
          className="border border-rule px-3 py-1 hover:bg-panel disabled:opacity-50"
        >
          Clear key
        </button>
      </form>
      <p className="mt-2 text-xs text-slate">
        Your key goes to the FixFrame server, which forwards it to Meta. FixFrame does not store it, but whoever runs this server could read it. This page holds it in memory until you clear it or refresh.
      </p>
    </section>
  );
}
