import { z } from "zod";
import {
  EvidenceRefSchema,
  IssueSchema,
  type Issue,
  type Provenance,
  type ProviderError,
  type Scenario,
} from "../contracts";
import { evidenceRefResolves } from "./evidence";
import { findUnsafeClaims } from "./safety";

// Only these fields are accepted from a model. Anything else it sends (location, assetLabel,
// scenarioId, id, status...) is stripped, so it cannot overwrite trusted scenario identifiers.
const ModelIssueSchema = z.object({
  ...IssueSchema.pick({ title: true, description: true, category: true, urgency: true }).shape,
  evidence: IssueSchema.shape.evidence.min(1),
  unknowns: IssueSchema.shape.unknowns.min(1),
});

export type ModelIssueResult = { ok: true; issue: Issue } | { ok: false; error: ProviderError };

/** Turns untrusted model output into a needs_review Issue anchored on the trusted scenario. */
export function issueFromModelOutput(
  output: unknown,
  scenario: Scenario,
  provenance: Provenance,
  segmentationIds: readonly string[] = [],
): ModelIssueResult {
  const parsed = ModelIssueSchema.safeParse(output);
  if (!parsed.success) {
    return { ok: false, error: { code: "INVALID_RESPONSE", message: "Model output failed schema validation." } };
  }
  const candidate = parsed.data;
  if (!candidate.evidence.every((e) => evidenceRefResolves(e, scenario, segmentationIds))) {
    return { ok: false, error: { code: "INVALID_RESPONSE", message: "Model output cites evidence outside this scenario." } };
  }
  const unsafe = findUnsafeClaims(`${candidate.title}\n${candidate.description}`);
  if (unsafe.length > 0) {
    return {
      ok: false,
      error: { code: "SAFETY_REVIEW_REQUIRED", message: `Model output contains disallowed claims: ${unsafe.join(", ")}.` },
    };
  }
  return {
    ok: true,
    issue: {
      ...candidate,
      id: scenario.expectedIssueId,
      scenarioId: scenario.id,
      location: scenario.area,
      assetLabel: scenario.assetLabel,
      status: "needs_review",
      provenance: [provenance],
    },
  };
}
