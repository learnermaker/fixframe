import { describe, expect, it } from "vitest";
import { getFixtureIssue } from "../../data/fixtures";
import { SCENARIOS } from "../../data/scenarios";
import { IssueSchema, WORK_ORDER_STATUSES, WorkOrderEventSchema, WorkOrderSchema, type Issue } from "../contracts";
import {
  applyWorkflowAction,
  startWorkflow,
  WORK_ORDER_TRANSITIONS,
  type WorkflowAction,
  type WorkflowState,
  type WorkOrderStatus,
} from "./workOrderWorkflow";

type ActionBody = WorkflowAction extends infer A ? (A extends WorkflowAction ? Omit<A, "actor" | "at"> : never) : never;

const meta = { actor: "Demo Reviewer", at: "2026-11-04T10:00:00.000Z" };
const issueFor = (id = "water-ingress-01") => getFixtureIssue(id) as Issue;

function step(state: WorkflowState, body: ActionBody): WorkflowState {
  const result = applyWorkflowAction(state, { ...meta, ...body } as WorkflowAction);
  if (!result.ok) throw new Error(`${result.code}: ${result.message}`);
  return result.state;
}
const confirmed = (id?: string) => step(startWorkflow(issueFor(id)), { type: "confirm_issue" });
const withWorkOrder = (id?: string) => step(confirmed(id), { type: "create_work_order" });
const code = (state: WorkflowState, body: ActionBody) => {
  const result = applyWorkflowAction(state, { ...meta, ...body } as WorkflowAction);
  return result.ok ? "ok" : result.code;
};

describe("human confirmation gate", () => {
  it("refuses a work order before confirmation", () => {
    const state = startWorkflow(issueFor());
    expect(code(state, { type: "create_work_order" })).toBe("CONFIRMATION_REQUIRED");
    expect(state.workOrder).toBeNull();
  });

  it("refuses a work order after an edit reopens review", () => {
    const edited = step(confirmed(), { type: "edit_issue", edit: { urgency: "routine" } });
    expect(edited.issue.status).toBe("needs_review");
    expect(code(edited, { type: "create_work_order" })).toBe("CONFIRMATION_REQUIRED");
  });

  it("refuses a second work order and a second confirmation", () => {
    expect(code(withWorkOrder(), { type: "create_work_order" })).toBe("CONFIRMATION_REQUIRED");
    expect(code(confirmed(), { type: "confirm_issue" })).toBe("ISSUE_NOT_CONFIRMABLE");
  });

  it("refuses confirmation while the text holds a disallowed claim", () => {
    const state = step(startWorkflow(issueFor()), { type: "edit_issue", edit: { description: "Caused by a burst pipe." } });
    expect(code(state, { type: "confirm_issue" })).toBe("SAFETY_REVIEW_REQUIRED");
  });

  it("refuses an actor-less or undated action", () => {
    const state = startWorkflow(issueFor());
    for (const bad of [{ ...meta, actor: " " }, { ...meta, at: "now" }]) {
      expect(applyWorkflowAction(state, { ...bad, type: "confirm_issue" })).toMatchObject({ ok: false, code: "INVALID_ACTION" });
    }
  });
});

describe("issue edits", () => {
  it("apply with USER_EDIT provenance and a from/to audit event, keeping the fixture provenance", () => {
    const { issue, events } = step(startWorkflow(issueFor()), {
      type: "edit_issue",
      edit: { title: "Edited title", location: "Level 3" },
    });
    expect(IssueSchema.safeParse(issue).success).toBe(true);
    expect(issue).toMatchObject({ title: "Edited title", location: "Level 3" });
    expect(issue.provenance.map((p) => p.source)).toEqual(["DEMO_FIXTURE", "USER_EDIT"]);
    expect(events[0]).toMatchObject({
      type: "issue_edited",
      workOrderId: null,
      changes: [
        { field: "title", from: "Discoloured ceiling tile observed", to: "Edited title" },
        { field: "location", from: "Level 2 / North corridor", to: "Level 3" },
      ],
    });
  });

  it.each([
    ["unknowns", { unknowns: [] }],
    ["evidence", { evidence: [] }],
    ["status", { status: "completed" }],
    ["scenarioId", { scenarioId: "other" }],
    ["provenance", { provenance: [] }],
    ["an invalid enum", { urgency: "critical" }],
    ["a blank title", { title: " " }],
  ])("cannot change or clear %s", (_label, edit) => {
    const state = startWorkflow(issueFor());
    expect(code(state, { type: "edit_issue", edit } as ActionBody)).toBe("INVALID_ACTION");
  });

  it("are no-ops when nothing changes", () => {
    const state = startWorkflow(issueFor());
    expect(step(state, { type: "edit_issue", edit: { urgency: state.issue.urgency } })).toBe(state);
  });

  it("are closed once the work order exists", () => {
    expect(code(withWorkOrder(), { type: "edit_issue", edit: { title: "Late" } })).toBe("ISSUE_NOT_EDITABLE");
  });
});

describe("work order creation", () => {
  it.each(SCENARIOS.map((s) => s.id))("builds a schema-valid order from the safe template for %s", (id) => {
    const { workOrder, issue, events } = withWorkOrder(id);
    expect(WorkOrderSchema.safeParse(workOrder).success).toBe(true);
    expect(issue.status).toBe("work_order_created");
    expect(workOrder).toMatchObject({ issueId: issue.id, status: "open", feedback: [] });
    expect(workOrder?.checklist.every((c) => !c.done)).toBe(true);
    expect(events.map((e) => e.type)).toEqual(["issue_confirmed", "work_order_created"]);
    expect(events.every((e) => WorkOrderEventSchema.safeParse(e).success)).toBe(true);
    expect(workOrder?.events).toEqual(events);
  });

  it("preserves unknowns and evidence", () => {
    const original = issueFor();
    const { issue } = withWorkOrder();
    expect(issue.unknowns).toEqual(original.unknowns);
    expect(issue.evidence).toEqual(original.evidence);
  });

  it("refuses a scenario with no safe template", () => {
    const state = confirmed();
    expect(
      code({ ...state, issue: { ...state.issue, scenarioId: "unknown-scenario" } }, { type: "create_work_order" }),
    ).toBe("NO_TEMPLATE");
  });
});

describe("status transitions", () => {
  const atStatus = (status: WorkOrderStatus): WorkflowState => {
    const state = withWorkOrder();
    const path: Record<WorkOrderStatus, WorkOrderStatus[]> = {
      open: [],
      in_progress: ["in_progress"],
      blocked: ["blocked"],
      completed: ["in_progress", "completed"],
    };
    return path[status].reduce((s, next) => step(s, { type: "set_status", status: next }), state);
  };

  const cases = WORK_ORDER_STATUSES.flatMap((from) => WORK_ORDER_STATUSES.map((to) => [from, to] as const));
  it.each(cases)("%s -> %s follows the allowed graph", (from, to) => {
    const allowed = WORK_ORDER_TRANSITIONS[from].includes(to);
    expect(code(atStatus(from), { type: "set_status", status: to })).toBe(allowed ? "ok" : "INVALID_TRANSITION");
  });

  it("keeps the expected graph", () => {
    expect(WORK_ORDER_TRANSITIONS).toEqual({
      open: ["in_progress", "blocked"],
      in_progress: ["blocked", "completed"],
      blocked: ["in_progress"],
      completed: [],
    });
  });

  it("mirrors the status onto the issue and records an event", () => {
    const state = step(withWorkOrder(), { type: "set_status", status: "blocked" });
    expect(state.issue.status).toBe("blocked");
    expect(state.workOrder?.events.at(-1)).toMatchObject({
      type: "status_changed",
      workOrderId: "WO-DEMO-001",
      changes: [{ field: "status", from: "open", to: "blocked" }],
    });
  });

  it("needs a work order", () => {
    expect(code(startWorkflow(issueFor()), { type: "set_status", status: "in_progress" })).toBe("NO_WORK_ORDER");
  });
});

describe("checklist", () => {
  it("toggles an item and records an audit event", () => {
    const done = step(withWorkOrder(), { type: "set_checklist_item", itemId: "check-2", done: true });
    expect(done.workOrder?.checklist.map((c) => c.done)).toEqual([false, true, false]);
    expect(done.events.at(-1)).toMatchObject({ type: "checklist_updated", changes: [{ field: "check-2", from: "false", to: "true" }] });
    const reopened = step(done, { type: "set_checklist_item", itemId: "check-2", done: false });
    expect(reopened.workOrder?.checklist[1]?.done).toBe(false);
    expect(reopened.events).toHaveLength(done.events.length + 1);
  });

  it("does not log a no-op and rejects unknown items", () => {
    const state = withWorkOrder();
    expect(step(state, { type: "set_checklist_item", itemId: "check-1", done: false })).toBe(state);
    expect(code(state, { type: "set_checklist_item", itemId: "check-9", done: true })).toBe("UNKNOWN_CHECKLIST_ITEM");
    expect(code(startWorkflow(issueFor()), { type: "set_checklist_item", itemId: "check-1", done: true })).toBe("NO_WORK_ORDER");
  });
});

describe("feedback", () => {
  it("is stored with its author and recorded on the timeline", () => {
    const state = step(withWorkOrder(), { type: "add_feedback", message: "  Reviewed the photo.  " });
    expect(state.workOrder?.feedback).toEqual([
      { id: "feedback-1", author: meta.actor, message: "Reviewed the photo.", createdAt: meta.at },
    ]);
    expect(state.events.at(-1)?.type).toBe("feedback_added");
    expect(WorkOrderSchema.safeParse(state.workOrder).success).toBe(true);
  });

  it("rejects empty text and a missing work order", () => {
    expect(code(withWorkOrder(), { type: "add_feedback", message: "   " })).toBe("INVALID_ACTION");
    expect(code(startWorkflow(issueFor()), { type: "add_feedback", message: "x" })).toBe("NO_WORK_ORDER");
  });
});

describe("reducer", () => {
  const run = () => {
    let state = startWorkflow(issueFor());
    const bodies: ActionBody[] = [
      { type: "edit_issue", edit: { urgency: "priority_review" } },
      { type: "confirm_issue" },
      { type: "create_work_order" },
      { type: "set_checklist_item", itemId: "check-1", done: true },
      { type: "set_status", status: "in_progress" },
      { type: "add_feedback", message: "Looks fine to review." },
      { type: "set_status", status: "completed" },
    ];
    for (const body of bodies) state = step(state, body);
    return state;
  };

  it("is deterministic across the full journey, with sequential event IDs", () => {
    const state = run();
    expect(state).toEqual(run());
    expect(state.events.map((e) => e.id)).toEqual(["event-001", "event-002", "event-003", "event-004", "event-005", "event-006", "event-007"]);
    expect(state.issue.status).toBe("completed");
    expect(WorkOrderSchema.safeParse(state.workOrder).success).toBe(true);
    expect(IssueSchema.safeParse(state.issue).success).toBe(true);
  });

  it("does not mutate the state it receives", () => {
    const state = withWorkOrder();
    const snapshot = structuredClone(state);
    step(state, { type: "set_checklist_item", itemId: "check-1", done: true });
    step(state, { type: "set_status", status: "in_progress" });
    step(state, { type: "add_feedback", message: "x" });
    expect(state).toEqual(snapshot);
  });
});
