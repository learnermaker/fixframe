import type { Issue, ProviderError, Scenario, Segmentation } from "../../lib/contracts";

export type ProviderResult<T> = { ok: true; value: T } | { ok: false; error: ProviderError };

export const fail = (code: ProviderError["code"], message: string): { ok: false; error: ProviderError } => ({
  ok: false,
  error: { code, message },
});

export interface SegmentationProvider {
  segment(scenario: Scenario, prompt: string): Promise<ProviderResult<Segmentation>>;
}

export interface IssueExtractionProvider {
  extract(scenario: Scenario): Promise<ProviderResult<Issue>>;
}

export type Providers = { segmentation: SegmentationProvider; extraction: IssueExtractionProvider };
