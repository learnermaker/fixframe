"use client";

import Image from "next/image";
import { useState } from "react";
import type { ProviderError, Scenario, Segmentation } from "../lib/contracts";
import { applyWorkflowAction, startWorkflow, type WorkflowAction, type WorkflowState } from "../lib/workflow/workOrderWorkflow";
import { requestExtraction, requestSegmentation } from "./api";
import { ErrorNotice } from "./ErrorNotice";
import { IssueReview } from "./IssueReview";
import { ProvenanceList } from "./Provenance";
import { WorkOrderPanel } from "./WorkOrderPanel";

const ACTOR = "Demo Reviewer";

// Omit distributes over the union, so each action keeps its own fields.
type ActionBody = WorkflowAction extends infer A ? (A extends WorkflowAction ? Omit<A, "actor" | "at"> : never) : never;
export type DispatchWorkflow = (action: ActionBody) => boolean;

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`step-${number}`} className="border-t-2 border-graphite pt-3">
      <h2 id={`step-${number}`} className="font-display text-2xl">{number}. {title}</h2>
      <div className="mt-2 space-y-3">{children}</div>
    </section>
  );
}

export function ScenarioWorkspace({ scenario, apiKey }: { scenario: Scenario; apiKey: string | null }) {
  const [prompt, setPrompt] = useState(scenario.segmentationPrompt);
  const [segmentation, setSegmentation] = useState<Segmentation | null>(null);
  const [segmenting, setSegmenting] = useState(false);
  const [segmentError, setSegmentError] = useState<ProviderError | null>(null);
  const [overlayOn, setOverlayOn] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<ProviderError | null>(null);
  const [workflow, setWorkflow] = useState<WorkflowState | null>(null);
  const [workflowError, setWorkflowError] = useState<string | null>(null);

  async function runSegmentation() {
    setSegmenting(true);
    setSegmentError(null);
    const result = await requestSegmentation(scenario.id, prompt, apiKey);
    setSegmenting(false);
    if (result.ok) setSegmentation(result.segmentation);
    else setSegmentError(result.error);
  }

  async function runExtraction() {
    setExtracting(true);
    setExtractError(null);
    const result = await requestExtraction(scenario.id, apiKey);
    setExtracting(false);
    if (result.ok) setWorkflow(startWorkflow(result.issue));
    else setExtractError(result.error);
  }

  const dispatch: DispatchWorkflow = (action) => {
    if (!workflow) return false;
    const result = applyWorkflowAction(workflow, { ...action, actor: ACTOR, at: new Date().toISOString() } as WorkflowAction);
    setWorkflowError(result.ok ? null : result.message);
    if (result.ok) setWorkflow(result.state);
    return result.ok;
  };

  return (
    <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <section aria-labelledby="evidence-heading" className="space-y-3 lg:sticky lg:top-4">
        <h2 id="evidence-heading" className="font-display text-2xl">Source evidence</h2>
        <figure>
          {/* The frame shrinks to the capped image, because the overlay is positioned against it. */}
          <div className="relative mx-auto w-fit max-w-full">
            <Image
              src={scenario.image.path}
              alt={scenario.image.alt}
              width={scenario.image.width}
              height={scenario.image.height}
              unoptimized
              className="block h-auto max-h-[70vh] w-auto max-w-full"
            />
            {segmentation && overlayOn && <RegionOverlay segmentation={segmentation} />}
          </div>
          {scenario.image.credit && (
            <p className="mt-1 text-xs text-slate">
              <a href={scenario.image.credit.url} target="_blank" rel="noreferrer" className="underline">{scenario.image.credit.text}</a>
            </p>
          )}
          {segmentation && (
            <figcaption className="mt-2 space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-slate">
                  {segmentation.boxes.length > 0
                    ? "The highlighted region is a selection aid, not proof of a defect."
                    : "Nothing matched that description. Try different words."}
                </p>
                <button type="button" aria-pressed={overlayOn} onClick={() => setOverlayOn(!overlayOn)} className="border border-rule px-2 text-sm hover:bg-panel">
                  {overlayOn ? "Hide overlay" : "Show overlay"}
                </button>
              </div>
              <ProvenanceList items={[segmentation.provenance]} />
            </figcaption>
          )}
        </figure>

        <blockquote className="border-l-4 border-rule pl-3">
          <p>{scenario.transcript}</p>
          <footer className="text-sm text-slate">Transcript</footer>
        </blockquote>

        <dl className="grid grid-cols-[auto_1fr] gap-x-4 text-sm">
          <dt className="text-slate">Site</dt><dd>{scenario.site}</dd>
          <dt className="text-slate">Area</dt><dd>{scenario.area}</dd>
          <dt className="text-slate">Asset</dt><dd>{scenario.assetLabel}</dd>
        </dl>
      </section>

      <div className="space-y-8">
        <Step number={1} title="Highlight the region">
          <div className="flex flex-wrap items-end gap-2">
            <label className="grow">
              <span className="block text-sm font-medium">What to look for in the image</span>
              <input value={prompt} onChange={(e) => setPrompt(e.target.value)} className="w-full border border-rule bg-panel px-2 py-1" />
            </label>
            <button type="button" disabled={segmenting || !prompt.trim()} onClick={runSegmentation} className="bg-graphite px-4 py-1.5 font-medium text-white hover:bg-slate disabled:opacity-50">
              {segmenting ? "Segmenting…" : "Run segmentation"}
            </button>
          </div>
          {segmentError && <ErrorNotice error={segmentError} onRetry={runSegmentation} />}
        </Step>

        <Step number={2} title="Extract the issue">
          <p className="text-sm text-slate">Reads the photo and transcript and drafts an issue for you to check.</p>
          <button type="button" disabled={extracting || workflow !== null} onClick={runExtraction} className="bg-graphite px-4 py-1.5 font-medium text-white hover:bg-slate disabled:opacity-50">
            {extracting ? "Extracting…" : "Extract issue"}
          </button>
          {extractError && <ErrorNotice error={extractError} onRetry={runExtraction} />}
        </Step>

        {workflow && !workflow.workOrder && (
          <Step number={3} title="Review and confirm">
            <IssueReview workflow={workflow} dispatch={dispatch} />
          </Step>
        )}

        {workflow?.workOrder && (
          <Step number={4} title="Track the work order">
            <WorkOrderPanel workflow={workflow} workOrder={workflow.workOrder} dispatch={dispatch} />
          </Step>
        )}

        {workflowError && (
          <p role="alert" className="border-l-4 border-alarm bg-panel p-3 text-sm">{workflowError}</p>
        )}

        {workflow && workflow.events.length > 0 && (
          <section aria-labelledby="timeline-heading">
            <h2 id="timeline-heading" className="font-display text-2xl">Audit timeline</h2>
            <ol aria-labelledby="timeline-heading" className="mt-2 space-y-1 border-l-2 border-rule pl-3 text-sm">
              {workflow.events.map((event) => (
                <li key={event.id}>
                  <time dateTime={event.createdAt} className="text-slate">{new Date(event.createdAt).toLocaleTimeString()}</time>{" "}
                  {event.message} <span className="text-slate">({event.actor})</span>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    </div>
  );
}

function RegionOverlay({ segmentation }: { segmentation: Segmentation }) {
  const { imageWidth: width, imageHeight: height, mask, boxes } = segmentation;
  // mask.value is schema-validated as a PNG data URL or a /demo-assets path, so it is safe in url().
  const maskUrl = `url("${mask.value}")`;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 bg-marker/30" style={{ maskImage: maskUrl, WebkitMaskImage: maskUrl, maskSize: "100% 100%", WebkitMaskSize: "100% 100%" }} />
      {boxes.map((box, index) => (
        <div
          key={index}
          className="absolute border-2 border-dashed border-marker"
          style={{ left: `${(box.x / width) * 100}%`, top: `${(box.y / height) * 100}%`, width: `${(box.width / width) * 100}%`, height: `${(box.height / height) * 100}%` }}
        />
      ))}
    </div>
  );
}
