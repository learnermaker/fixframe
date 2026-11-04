import { z } from "zod";

// Single source of truth for domain and API transport shapes. Owned by Workstream C.
// Changes to field names or enums need an ADR in docs/decisions/.

const NonEmpty = z.string().trim().min(1);
const IsoTimestamp = z.iso.datetime();

export const PROVENANCE_SOURCES = ["LIVE_META", "DEMO_FIXTURE", "USER_EDIT"] as const;
export const PROVENANCE_OPERATIONS = ["segmentation", "extraction", "transcription", "user_edit"] as const;
export const ISSUE_CATEGORIES = [
  "building_fabric",
  "plumbing_observation",
  "electrical_visual_observation",
  "accessibility_fixture",
  "other",
] as const;
// Workflow labels, not safety ratings.
export const ISSUE_URGENCIES = ["routine", "review", "priority_review"] as const;
export const ISSUE_STATUSES = [
  "needs_review",
  "confirmed",
  "work_order_created",
  "in_progress",
  "blocked",
  "completed",
] as const;
export const WORK_ORDER_STATUSES = ["open", "in_progress", "blocked", "completed"] as const;
export const EVIDENCE_KINDS = ["image_region", "transcript"] as const;
export const PROVIDER_ERROR_CODES = [
  "UNCONFIGURED",
  "TIMEOUT",
  "RATE_LIMITED",
  "UPSTREAM_ERROR",
  "INVALID_RESPONSE",
  "UNSUPPORTED_INPUT",
  "SAFETY_REVIEW_REQUIRED",
] as const;
export const WORK_ORDER_EVENT_TYPES = [
  "issue_edited",
  "issue_confirmed",
  "work_order_created",
  "status_changed",
  "checklist_updated",
  "feedback_added",
] as const;
export const MASK_FORMATS = ["alpha-png-data-url", "public-path"] as const;

export const ProvenanceSchema = z
  .strictObject({
    source: z.enum(PROVENANCE_SOURCES),
    provider: NonEmpty,
    model: NonEmpty.nullable(), // null only for USER_EDIT: no model was involved
    operation: z.enum(PROVENANCE_OPERATIONS),
    requestId: NonEmpty.nullable().optional(),
    createdAt: IsoTimestamp,
    fixtureId: NonEmpty.nullable().optional(),
  })
  .superRefine((p, ctx) => {
    const issue = (message: string) => ctx.addIssue({ code: "custom", message });
    if (p.source === "DEMO_FIXTURE" && !p.fixtureId) issue("DEMO_FIXTURE provenance requires fixtureId");
    if (p.source !== "DEMO_FIXTURE" && p.fixtureId) issue(`${p.source} provenance must not carry fixtureId`);
    if (p.source !== "USER_EDIT" && p.model === null) issue(`${p.source} provenance requires model`);
    if (p.source === "USER_EDIT" && p.model !== null) issue("USER_EDIT provenance must have null model");
    if ((p.source === "USER_EDIT") !== (p.operation === "user_edit")) {
      issue("operation user_edit and source USER_EDIT must be used together");
    }
  });
export type Provenance = z.infer<typeof ProvenanceSchema>;

export const EvidenceRefSchema = z.strictObject({
  kind: z.enum(EVIDENCE_KINDS),
  ref: NonEmpty,
  supports: NonEmpty,
});
export type EvidenceRef = z.infer<typeof EvidenceRefSchema>;

export const ScenarioSchema = z.strictObject({
  id: NonEmpty,
  title: NonEmpty,
  synthetic: z.literal(true),
  site: NonEmpty,
  area: NonEmpty,
  assetLabel: NonEmpty,
  image: z.strictObject({
    path: z.string().regex(/^\/demo-assets\/[\w/-]+\.(png|jpg)$/),
    alt: NonEmpty,
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    credit: z.strictObject({ text: NonEmpty, url: z.url() }).optional(), // required by the photo's licence where it has one
  }),
  transcript: NonEmpty,
  segmentationPrompt: NonEmpty, // noun phrase sent as the POST /api/segment `prompt`
  expectedIssueId: NonEmpty,
});
export type Scenario = z.infer<typeof ScenarioSchema>;

export const IssueSchema = z.strictObject({
  id: NonEmpty,
  scenarioId: NonEmpty,
  title: NonEmpty,
  description: NonEmpty,
  location: NonEmpty,
  assetLabel: NonEmpty,
  category: z.enum(ISSUE_CATEGORIES),
  urgency: z.enum(ISSUE_URGENCIES),
  status: z.enum(ISSUE_STATUSES),
  confidence: z.null().optional(), // numeric scores are rejected: no calibrated score exists
  evidence: z.array(EvidenceRefSchema),
  unknowns: z.array(NonEmpty),
  provenance: z.array(ProvenanceSchema),
});
export type Issue = z.infer<typeof IssueSchema>;

export const ChecklistItemSchema = z.strictObject({
  id: NonEmpty,
  label: NonEmpty,
  done: z.boolean(),
});
export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;

export const WorkOrderEventSchema = z.strictObject({
  id: NonEmpty,
  type: z.enum(WORK_ORDER_EVENT_TYPES),
  issueId: NonEmpty,
  workOrderId: NonEmpty.nullable(), // null for review events that precede the work order
  actor: NonEmpty,
  message: NonEmpty,
  createdAt: IsoTimestamp,
  changes: z
    .array(z.strictObject({ field: NonEmpty, from: z.string().nullable(), to: z.string().nullable() }))
    .optional(),
});
export type WorkOrderEvent = z.infer<typeof WorkOrderEventSchema>;

export const FeedbackSchema = z.strictObject({
  id: NonEmpty,
  author: NonEmpty,
  message: NonEmpty,
  createdAt: IsoTimestamp,
});
export type Feedback = z.infer<typeof FeedbackSchema>;

export const WorkOrderSchema = z.strictObject({
  id: NonEmpty,
  issueId: NonEmpty,
  title: NonEmpty,
  summary: NonEmpty,
  owner: NonEmpty,
  status: z.enum(WORK_ORDER_STATUSES),
  checklist: z.array(ChecklistItemSchema),
  acceptanceCriteria: z.array(NonEmpty),
  feedback: z.array(FeedbackSchema),
  events: z.array(WorkOrderEventSchema),
});
export type WorkOrder = z.infer<typeof WorkOrderSchema>;

export const ProviderErrorSchema = z.strictObject({
  code: z.enum(PROVIDER_ERROR_CODES),
  message: NonEmpty,
});
export type ProviderError = z.infer<typeof ProviderErrorSchema>;

export const BoxSchema = z.strictObject({
  x: z.number().nonnegative(),
  y: z.number().nonnegative(),
  width: z.number().positive(),
  height: z.number().positive(),
});
export type Box = z.infer<typeof BoxSchema>;

const MASK_VALUE_PATTERNS: Record<(typeof MASK_FORMATS)[number], RegExp> = {
  "alpha-png-data-url": /^data:image\/png;base64,[A-Za-z0-9+/]+=*$/,
  "public-path": /^\/demo-assets\/masks\/[\w-]+\.png$/,
};

export const SegmentationSchema = z
  .strictObject({
    id: NonEmpty,
    imageWidth: z.number().int().positive(),
    imageHeight: z.number().int().positive(),
    mask: z.strictObject({ format: z.enum(MASK_FORMATS), value: NonEmpty }),
    boxes: z.array(BoxSchema),
    provenance: ProvenanceSchema,
  })
  .superRefine((s, ctx) => {
    if (!MASK_VALUE_PATTERNS[s.mask.format].test(s.mask.value)) {
      ctx.addIssue({ code: "custom", message: `mask value does not match format ${s.mask.format}` });
    }
    if (s.boxes.some((b) => b.x + b.width > s.imageWidth || b.y + b.height > s.imageHeight)) {
      ctx.addIssue({ code: "custom", message: "box lies outside the image bounds" });
    }
  });
export type Segmentation = z.infer<typeof SegmentationSchema>;

export const SegmentRequestSchema = z.strictObject({ scenarioId: NonEmpty, prompt: NonEmpty });
export type SegmentRequest = z.infer<typeof SegmentRequestSchema>;
export const ExtractRequestSchema = z.strictObject({ scenarioId: NonEmpty });
export type ExtractRequest = z.infer<typeof ExtractRequestSchema>;

const ErrorResponseSchema = z.strictObject({ ok: z.literal(false), error: ProviderErrorSchema });
export const SegmentResponseSchema = z.discriminatedUnion("ok", [
  z.strictObject({ ok: z.literal(true), segmentation: SegmentationSchema }),
  ErrorResponseSchema,
]);
export type SegmentResponse = z.infer<typeof SegmentResponseSchema>;
export const ExtractResponseSchema = z.discriminatedUnion("ok", [
  z.strictObject({ ok: z.literal(true), issue: IssueSchema }),
  ErrorResponseSchema,
]);
export type ExtractResponse = z.infer<typeof ExtractResponseSchema>;
