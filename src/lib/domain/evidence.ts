import type { EvidenceRef, Scenario } from "../contracts";

// A scenario holds exactly one transcript, so its evidence ref derives from the scenario id.
export const transcriptRef = (scenarioId: string) => `transcript-${scenarioId}`;

/** True when a ref points at this scenario's transcript or a segmentation produced for it. */
export function evidenceRefResolves(
  evidence: EvidenceRef,
  scenario: Scenario,
  segmentationIds: readonly string[],
): boolean {
  return evidence.kind === "transcript"
    ? evidence.ref === transcriptRef(scenario.id)
    : segmentationIds.includes(evidence.ref);
}
