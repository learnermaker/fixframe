"use client";

import Image from "next/image";
import { useState } from "react";
import { SCENARIOS } from "../data/scenarios";
import { ProviderPanel } from "./ProviderPanel";
import { ScenarioWorkspace } from "./ScenarioWorkspace";

type Props = { providerMode: "fixture" | "live"; hasDeploymentKey: boolean };

export function FixFrameApp({ providerMode, hasDeploymentKey }: Props) {
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  // Memory only, by design (ADR 0002): never written to storage, cookies, URLs or workflow state.
  const [sessionKey, setSessionKey] = useState<string | null>(null);
  const scenario = SCENARIOS.find((s) => s.id === scenarioId);

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-8">
        <header className="flex flex-wrap items-start justify-between gap-6 py-6">
          <div className="max-w-xl">
            <h1 className="font-display text-5xl leading-none">FixFrame</h1>
            <p className="mt-2 text-lg">
              Turn a photo and a spoken note into a maintenance work order, with a person confirming every issue first.
            </p>
          </div>
          <ProviderPanel
            providerMode={providerMode}
            hasDeploymentKey={hasDeploymentKey}
            sessionKeySet={sessionKey !== null}
            onUseKey={setSessionKey}
            onClearKey={() => setSessionKey(null)}
          />
        </header>

        <section aria-labelledby="scenario-heading">
          <h2 id="scenario-heading" className="font-display text-2xl">Choose a scenario</h2>
          <div className="mt-2 grid gap-3 sm:grid-cols-3">
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                type="button"
                aria-pressed={s.id === scenarioId}
                onClick={() => setScenarioId(s.id)}
                className={`flex items-center gap-3 border-2 bg-panel p-2 text-left hover:border-graphite ${s.id === scenarioId ? "border-graphite" : "border-transparent"}`}
              >
                <Image src={s.image.path} alt="" width={96} height={54} unoptimized className="shrink-0" />
                <span>
                  <span className="block font-semibold leading-tight">{s.title}</span>
                  <span className="block text-sm text-slate">{s.site}</span>
                </span>
              </button>
            ))}
          </div>
        </section>

        {scenario ? (
          // The key resets all per-scenario state when another scenario is chosen.
          <ScenarioWorkspace key={scenario.id} scenario={scenario} apiKey={providerMode === "live" ? sessionKey : null} />
        ) : (
          <p className="mt-8 text-slate">Choose a scenario to see its photo and transcript.</p>
        )}
      </div>
    </>
  );
}
