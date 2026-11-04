"use client";

import { useState } from "react";
import type { WorkOrder } from "../lib/contracts";
import { WORK_ORDER_TRANSITIONS, type WorkflowState, type WorkOrderStatus } from "../lib/workflow/workOrderWorkflow";
import { ProvenanceList } from "./Provenance";
import type { DispatchWorkflow } from "./ScenarioWorkspace";

const STATUS_LABELS: Record<WorkOrderStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  blocked: "Blocked",
  completed: "Completed",
};

type Props = { workflow: WorkflowState; workOrder: WorkOrder; dispatch: DispatchWorkflow };

export function WorkOrderPanel({ workflow, workOrder, dispatch }: Props) {
  const [feedback, setFeedback] = useState("");
  const { issue } = workflow;
  const nextStatuses = WORK_ORDER_TRANSITIONS[workOrder.status];

  return (
    <article className="job-tag bg-tag/70 px-5 pb-5 pt-12">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-display text-3xl">{workOrder.id}</p>
        <p className="text-sm">{workOrder.owner}</p>
      </header>
      <h3 className="mt-1 text-lg font-semibold leading-snug">{workOrder.title}</h3>
      <p>{workOrder.summary}</p>

      <div className="mt-3 border-y border-tag-deep/40 py-2 text-sm">
        <p className="font-semibold">{issue.title}</p>
        <p>{issue.description}</p>
        <p className="text-graphite/80">{issue.location}, {issue.assetLabel}</p>
        <p className="mt-1"><span className="font-medium">Still unknown:</span> {issue.unknowns.join(", ")}</p>
        <div className="mt-1 [&_*]:text-graphite"><ProvenanceList items={issue.provenance} /></div>
      </div>

      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <fieldset>
          <legend className="font-semibold">Checklist</legend>
          {workOrder.checklist.map((item) => (
            <label key={item.id} className="mt-1 flex items-start gap-2">
              <input
                type="checkbox"
                checked={item.done}
                onChange={(e) => dispatch({ type: "set_checklist_item", itemId: item.id, done: e.target.checked })}
                className="mt-1.5 accent-graphite"
              />
              <span>{item.label}</span>
            </label>
          ))}
        </fieldset>
        <div>
          <h4 className="font-semibold">Done when</h4>
          <ul className="list-disc pl-5">{workOrder.acceptanceCriteria.map((c) => <li key={c}>{c}</li>)}</ul>
        </div>
      </div>

      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="wo-status" className="block font-semibold">Status</label>
          <select
            id="wo-status"
            value={workOrder.status}
            disabled={nextStatuses.length === 0}
            onChange={(e) => dispatch({ type: "set_status", status: e.target.value as WorkOrderStatus })}
            className="w-full border border-tag-deep/60 bg-panel px-2 py-1"
          >
            {[workOrder.status, ...nextStatuses].map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (dispatch({ type: "add_feedback", message: feedback })) setFeedback("");
          }}
        >
          <label htmlFor="wo-feedback" className="block font-semibold">Feedback</label>
          <textarea id="wo-feedback" rows={2} value={feedback} onChange={(e) => setFeedback(e.target.value)} className="w-full border border-tag-deep/60 bg-panel px-2 py-1" />
          <button type="submit" className="mt-1 border border-graphite px-3 py-1 font-medium hover:bg-panel">Add feedback</button>
        </form>
      </div>

      {workOrder.feedback.length > 0 && (
        <ul className="mt-3 space-y-1">
          {workOrder.feedback.map((f) => <li key={f.id}>{f.message} <span className="text-sm text-graphite/80">({f.author})</span></li>)}
        </ul>
      )}
    </article>
  );
}
