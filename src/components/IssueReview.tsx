"use client";

import { ISSUE_CATEGORIES, ISSUE_URGENCIES, type Issue } from "../lib/contracts";
import type { IssueEdit, WorkflowState } from "../lib/workflow/workOrderWorkflow";
import { ProvenanceList, SourceChip } from "./Provenance";
import type { DispatchWorkflow } from "./ScenarioWorkspace";

const humanize = (value: string) => (value.charAt(0).toUpperCase() + value.slice(1)).replaceAll("_", " ");
const FIELD_CLASS = "w-full border border-rule bg-panel px-2 py-1";

type Props = { workflow: WorkflowState; dispatch: DispatchWorkflow };

export function IssueReview({ workflow, dispatch }: Props) {
  const { issue } = workflow;
  const confirmed = issue.status === "confirmed";
  const edited = new Set(workflow.events.filter((e) => e.type === "issue_edited").flatMap((e) => e.changes?.map((c) => c.field) ?? []));
  const edit = (patch: IssueEdit) => dispatch({ type: "edit_issue", edit: patch });
  const textField = { issue, edited, edit };

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField {...textField} field="title" label="Title" wide />
        <TextField {...textField} field="description" label="Description" wide multiline />
        <TextField {...textField} field="location" label="Location" />
        <TextField {...textField} field="assetLabel" label="Asset label" />
        <SelectField {...textField} field="category" label="Category" options={ISSUE_CATEGORIES} />
        <SelectField {...textField} field="urgency" label="Urgency" options={ISSUE_URGENCIES} hint="A workflow label, not a safety rating." />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <h3 className="font-semibold">Still unknown</h3>
          <ul className="list-disc pl-5 text-sm">{issue.unknowns.map((u) => <li key={u}>{u}</li>)}</ul>
        </div>
        <div>
          <h3 className="font-semibold">Evidence cited</h3>
          <ul className="list-disc pl-5 text-sm">
            {issue.evidence.map((e) => <li key={e.ref}>{e.supports} <span className="text-slate">({e.kind === "transcript" ? "transcript" : "image region"})</span></li>)}
          </ul>
        </div>
      </div>

      <div className="border-t border-rule pt-3">
        {confirmed ? (
          <p className="text-sm font-medium">Issue confirmed. Changing a field sends it back for review.</p>
        ) : (
          <>
            <p className="mb-2 text-sm">Confirm only if this matches what the evidence shows. No work order exists until you do.</p>
            <button type="button" onClick={() => dispatch({ type: "confirm_issue" })} className="bg-graphite px-4 py-1.5 font-medium text-white hover:bg-slate">
              Confirm issue
            </button>
          </>
        )}
        <button
          type="button"
          disabled={!confirmed}
          onClick={() => dispatch({ type: "create_work_order" })}
          className="ml-2 border-2 border-graphite px-4 py-1 font-medium hover:bg-tag disabled:border-rule disabled:text-slate disabled:hover:bg-transparent"
        >
          Create work order
        </button>
      </div>

      {/* Below the buttons on purpose: an edit commits on blur and adds a row here, and a row above them would move Confirm between mouse-down and mouse-up, losing the click. */}
      <div>
        <h3 className="font-semibold">Where this came from</h3>
        <ProvenanceList items={issue.provenance} />
      </div>
    </>
  );
}

type FieldBase = { issue: Issue; edited: Set<string>; label: string; edit: (patch: IssueEdit) => boolean };

// Commits on blur or Enter, so one correction makes one audit event rather than one per keystroke.
function TextField({ issue, edited, label, edit, field, wide, multiline }: FieldBase & { field: "title" | "description" | "location" | "assetLabel"; wide?: boolean; multiline?: boolean }) {
  const value = issue[field];
  const commit = (input: HTMLInputElement | HTMLTextAreaElement) => {
    if (input.value !== value && !edit({ [field]: input.value })) input.value = value;
  };
  const id = `issue-${field}`;
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <div className="flex min-h-6 items-center text-sm font-medium">
        <label htmlFor={id}>{label}</label>
        {edited.has(field) && <span className="ml-2"><SourceChip source="USER_EDIT" /></span>}
      </div>
      {multiline ? (
        <textarea id={id} defaultValue={value} rows={2} onBlur={(e) => commit(e.currentTarget)} className={FIELD_CLASS} />
      ) : (
        <input
          id={id}
          defaultValue={value}
          onBlur={(e) => commit(e.currentTarget)}
          onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
          className={FIELD_CLASS}
        />
      )}
    </div>
  );
}

function SelectField({ issue, edited, label, edit, field, options, hint }: FieldBase & { field: "category" | "urgency"; options: readonly string[]; hint?: string }) {
  const id = `issue-${field}`;
  return (
    <div>
      <div className="flex min-h-6 items-center text-sm font-medium">
        <label htmlFor={id}>{label}</label>
        {edited.has(field) && <span className="ml-2"><SourceChip source="USER_EDIT" /></span>}
      </div>
      <select id={id} value={issue[field]} onChange={(e) => edit({ [field]: e.target.value } as IssueEdit)} className={FIELD_CLASS}>
        {options.map((option) => <option key={option} value={option}>{humanize(option)}</option>)}
      </select>
      {hint && <p className="text-xs text-slate">{hint}</p>}
    </div>
  );
}
