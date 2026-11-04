import { z } from "zod";
import { WORK_ORDER_TEMPLATES } from "../../data/workOrderTemplates";
import { IssueSchema, WorkOrderEventSchema, type Issue, type WorkOrder, type WorkOrderEvent } from "../contracts";
import { findUnsafeClaims } from "../domain/safety";

export type WorkOrderStatus = WorkOrder["status"];

export const WORK_ORDER_TRANSITIONS: Readonly<Record<WorkOrderStatus, readonly WorkOrderStatus[]>> = {
  open: ["in_progress", "blocked"],
  in_progress: ["blocked", "completed"],
  blocked: ["in_progress"],
  completed: [],
};

// Evidence, unknowns, status and identifiers are absent on purpose: edits cannot touch them.
export const IssueEditSchema = IssueSchema.pick({
  title: true,
  description: true,
  location: true,
  assetLabel: true,
  category: true,
  urgency: true,
}).partial();
export type IssueEdit = z.infer<typeof IssueEditSchema>;

export type WorkflowState = {
  issue: Issue;
  workOrder: WorkOrder | null;
  /** Full audit timeline. Mirrored onto the work order so it stands alone once created. */
  events: WorkOrderEvent[];
};

export type WorkflowAction = { actor: string; at: string } & (
  | { type: "edit_issue"; edit: IssueEdit }
  | { type: "confirm_issue" }
  | { type: "create_work_order" }
  | { type: "set_status"; status: WorkOrderStatus }
  | { type: "set_checklist_item"; itemId: string; done: boolean }
  | { type: "add_feedback"; message: string }
);

export type WorkflowErrorCode =
  | "INVALID_ACTION"
  | "ISSUE_NOT_EDITABLE"
  | "ISSUE_NOT_CONFIRMABLE"
  | "CONFIRMATION_REQUIRED"
  | "SAFETY_REVIEW_REQUIRED"
  | "NO_TEMPLATE"
  | "NO_WORK_ORDER"
  | "INVALID_TRANSITION"
  | "UNKNOWN_CHECKLIST_ITEM";

export type WorkflowResult =
  | { ok: true; state: WorkflowState }
  | { ok: false; code: WorkflowErrorCode; message: string };

export const startWorkflow = (issue: Issue): WorkflowState => ({
  issue: structuredClone(issue),
  workOrder: null,
  events: [],
});

const fail = (code: WorkflowErrorCode, message: string): WorkflowResult => ({ ok: false, code, message });

const ActionMetaSchema = WorkOrderEventSchema.pick({ actor: true, createdAt: true });

/** Pure, deterministic reducer: the caller supplies actor and timestamp; IDs derive from state. */
export function applyWorkflowAction(state: WorkflowState, action: WorkflowAction): WorkflowResult {
  const meta = ActionMetaSchema.safeParse({ actor: action.actor, createdAt: action.at });
  if (!meta.success) return fail("INVALID_ACTION", "An action needs a named actor and an ISO timestamp.");
  const { issue, workOrder } = state;

  const withEvent = (next: WorkflowState, event: Pick<WorkOrderEvent, "type" | "message" | "changes">): WorkflowResult => {
    const events: WorkOrderEvent[] = [
      ...state.events,
      {
        id: `event-${String(state.events.length + 1).padStart(3, "0")}`,
        issueId: next.issue.id,
        workOrderId: next.workOrder?.id ?? null,
        ...meta.data,
        ...event,
      },
    ];
    return { ok: true, state: { ...next, events, workOrder: next.workOrder && { ...next.workOrder, events } } };
  };

  switch (action.type) {
    case "edit_issue": {
      if (issue.status !== "needs_review" && issue.status !== "confirmed") {
        return fail("ISSUE_NOT_EDITABLE", "An issue cannot be edited after its work order is created.");
      }
      const edit = IssueEditSchema.safeParse(action.edit);
      if (!edit.success) return fail("INVALID_ACTION", "Only descriptive issue fields can be edited, with valid values.");
      const changes = (Object.keys(edit.data) as (keyof IssueEdit)[])
        .filter((field) => edit.data[field] !== issue[field])
        .map((field) => ({ field, from: issue[field], to: edit.data[field] as string }));
      if (changes.length === 0) return { ok: true, state };
      return withEvent(
        {
          ...state,
          issue: {
            ...issue,
            ...edit.data,
            status: "needs_review", // an edit invalidates any earlier confirmation
            provenance: [
              ...issue.provenance,
              { source: "USER_EDIT", provider: "user", model: null, operation: "user_edit", createdAt: action.at },
            ],
          },
        },
        { type: "issue_edited", message: `Edited ${changes.map((c) => c.field).join(", ")}`, changes },
      );
    }

    case "confirm_issue": {
      if (issue.status !== "needs_review") return fail("ISSUE_NOT_CONFIRMABLE", "Only an issue awaiting review can be confirmed.");
      const unsafe = findUnsafeClaims(`${issue.title}\n${issue.description}`);
      if (unsafe.length > 0) {
        return fail("SAFETY_REVIEW_REQUIRED", `Remove disallowed claims before confirming: ${unsafe.join(", ")}.`);
      }
      return withEvent(
        { ...state, issue: { ...issue, status: "confirmed" } },
        {
          type: "issue_confirmed",
          message: "Issue confirmed by human reviewer",
          changes: [{ field: "status", from: issue.status, to: "confirmed" }],
        },
      );
    }

    case "create_work_order": {
      if (issue.status !== "confirmed") {
        return fail("CONFIRMATION_REQUIRED", "A human must confirm the issue before a work order is created.");
      }
      const template = WORK_ORDER_TEMPLATES[issue.scenarioId];
      if (!template) return fail("NO_TEMPLATE", `No safe work-order template for scenario ${issue.scenarioId}.`);
      return withEvent(
        {
          ...state,
          issue: { ...issue, status: "work_order_created" },
          workOrder: {
            id: template.id,
            issueId: issue.id,
            title: template.title,
            summary: template.summary,
            owner: template.owner,
            status: "open",
            checklist: template.checklist.map((item) => ({ ...item, done: false })),
            acceptanceCriteria: [...template.acceptanceCriteria],
            feedback: [],
            events: [],
          },
        },
        { type: "work_order_created", message: `Work order ${template.id} created` },
      );
    }

    case "set_status": {
      if (!workOrder) return fail("NO_WORK_ORDER", "No work order exists yet.");
      if (!WORK_ORDER_TRANSITIONS[workOrder.status].includes(action.status)) {
        return fail("INVALID_TRANSITION", `Cannot move a work order from ${workOrder.status} to ${action.status}.`);
      }
      return withEvent(
        {
          ...state,
          // Nothing transitions back to open; the other statuses share a name with the issue's.
          issue: { ...issue, status: action.status === "open" ? "work_order_created" : action.status },
          workOrder: { ...workOrder, status: action.status },
        },
        {
          type: "status_changed",
          message: `Status changed to ${action.status}`,
          changes: [{ field: "status", from: workOrder.status, to: action.status }],
        },
      );
    }

    case "set_checklist_item": {
      if (!workOrder) return fail("NO_WORK_ORDER", "No work order exists yet.");
      const item = workOrder.checklist.find((c) => c.id === action.itemId);
      if (!item) return fail("UNKNOWN_CHECKLIST_ITEM", `No checklist item ${action.itemId}.`);
      if (item.done === action.done) return { ok: true, state };
      return withEvent(
        {
          ...state,
          workOrder: {
            ...workOrder,
            checklist: workOrder.checklist.map((c) => (c.id === item.id ? { ...c, done: action.done } : c)),
          },
        },
        {
          type: "checklist_updated",
          message: `${action.done ? "Completed" : "Reopened"}: ${item.label}`,
          changes: [{ field: item.id, from: String(item.done), to: String(action.done) }],
        },
      );
    }

    case "add_feedback": {
      if (!workOrder) return fail("NO_WORK_ORDER", "No work order exists yet.");
      const message = action.message.trim();
      if (!message) return fail("INVALID_ACTION", "Feedback cannot be empty.");
      return withEvent(
        {
          ...state,
          workOrder: {
            ...workOrder,
            feedback: [
              ...workOrder.feedback,
              { id: `feedback-${workOrder.feedback.length + 1}`, author: meta.data.actor, message, createdAt: meta.data.createdAt },
            ],
          },
        },
        { type: "feedback_added", message: "Feedback added" },
      );
    }
  }
}
