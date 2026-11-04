import { ISSUE_CATEGORIES, ISSUE_URGENCIES, type Scenario } from "../../lib/contracts";
import { transcriptRef } from "../../lib/domain/evidence";
import { issueFromModelOutput } from "../../lib/domain/modelIssue";
import { findUnsafeClaims } from "../../lib/domain/safety";
import { loadScenarioImage } from "./demoImage";
import { createResponse } from "./metaClient";
import { fail, type IssueExtractionProvider } from "./types";

const MODEL = "muse-spark-1.3";

// Generous against the longest live drafts seen (about 450 characters): a person has to read this.
const MAX_TITLE = 200;
const MAX_DESCRIPTION = 2000;
const MAX_LIST_ITEM = 500;
const MAX_LIST_ITEMS = 20;

const uniqueBy = <T>(items: T[], key: (item: T) => string) => [...new Map(items.map((item) => [key(item), item])).values()];

// ponytail: evidence is transcript-only because ExtractRequest has no segmentation id, so an
// image_region ref could never resolve. Widen this once the contract carries one (needs an ADR).
const issueSchema = (scenario: Scenario) => {
  const text = { type: "string" };
  return {
    type: "object",
    additionalProperties: false,
    required: ["title", "description", "category", "urgency", "evidence", "unknowns"],
    properties: {
      title: text,
      description: text,
      category: { type: "string", enum: ISSUE_CATEGORIES },
      urgency: { type: "string", enum: ISSUE_URGENCIES },
      evidence: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["kind", "ref", "supports"],
          properties: {
            kind: { type: "string", enum: ["transcript"] },
            ref: { type: "string", enum: [transcriptRef(scenario.id)] },
            supports: text,
          },
        },
      },
      unknowns: { type: "array", items: text },
    },
  };
};

const instructions = (scenario: Scenario) =>
  [
    "Draft a maintenance issue for a person to review, from this synthetic photo and the note below.",
    "Describe only what is visible or stated. Do not state a cause or diagnosis, and do not say whether anything is safe.",
    "Do not repeat the site, area or asset in the title or description. FixFrame adds those itself.",
    "List what cannot be known from this evidence under unknowns. Urgency is a workflow label, not a safety rating.",
    "Cite the note as evidence and say in supports what it establishes.",
    `Site: ${scenario.site}. Area: ${scenario.area}. Asset: ${scenario.assetLabel}.`,
    `Note: ${scenario.transcript}`,
  ].join("\n");

export const museProvider = (key: string): IssueExtractionProvider => ({
  async extract(scenario) {
    const image = await loadScenarioImage(scenario);
    const response = await createResponse(key, {
      model: MODEL,
      input: [{ type: "message", role: "user", content: [{ type: "input_text", text: instructions(scenario) }, image.part] }],
      text: { format: { type: "json_schema", name: "maintenance_issue", strict: true, schema: issueSchema(scenario) } },
    });
    if (!response.ok) return response;

    let output: unknown;
    try {
      output = JSON.parse(response.value.text);
    } catch {
      return fail("INVALID_RESPONSE", "Muse Spark's output was not valid JSON, so it was discarded.");
    }
    const result = issueFromModelOutput(output, scenario, {
      source: "LIVE_META",
      provider: "meta",
      model: MODEL,
      operation: "extraction",
      requestId: response.value.requestId,
      createdAt: new Date().toISOString(),
    });
    if (!result.ok) return result;

    const { issue } = result;
    const lists = [...issue.unknowns, ...issue.evidence.map((e) => e.supports)];
    if (
      issue.title.length > MAX_TITLE ||
      issue.description.length > MAX_DESCRIPTION ||
      issue.unknowns.length > MAX_LIST_ITEMS ||
      issue.evidence.length > MAX_LIST_ITEMS ||
      lists.some((item) => item.length > MAX_LIST_ITEM)
    ) {
      return fail("INVALID_RESPONSE", "Muse Spark's draft was too long to review, so it was discarded.");
    }
    // issueFromModelOutput checks the title and description. Evidence text is shown as fact too;
    // unknowns are not scanned because "whether it is safe" is a question, not a claim.
    const unsafe = findUnsafeClaims(issue.evidence.map((e) => e.supports).join("\n"));
    if (unsafe.length > 0) {
      return fail("SAFETY_REVIEW_REQUIRED", `Model output contains disallowed claims: ${unsafe.join(", ")}.`);
    }
    return {
      ok: true,
      value: {
        ...issue,
        evidence: uniqueBy(issue.evidence, (e) => `${e.ref}\n${e.supports.toLowerCase()}`),
        unknowns: uniqueBy(issue.unknowns, (u) => u.toLowerCase()),
      },
    };
  },
});
