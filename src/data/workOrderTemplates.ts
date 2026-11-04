import type { ChecklistItem } from "../lib/contracts";

export type WorkOrderTemplate = {
  id: string;
  title: string;
  summary: string;
  owner: string;
  checklist: readonly Omit<ChecklistItem, "done">[];
  acceptanceCriteria: readonly string[];
};

// Administrative review tasks only: never repair steps, diagnoses or safety sign-off.
export const WORK_ORDER_TEMPLATES: Readonly<Record<string, WorkOrderTemplate>> = {
  "water-ingress-01": {
    id: "WO-DEMO-001",
    title: "Review reported ceiling tile discolouration",
    summary: "Review the observation and determine whether a qualified inspection is needed.",
    owner: "Demo Facilities Team",
    checklist: [
      { id: "check-1", label: "Confirm the reported corridor location" },
      { id: "check-2", label: "Review the source photo and note" },
      { id: "check-3", label: "Record a qualified follow-up decision" },
    ],
    acceptanceCriteria: [
      "Observation and unknowns have been reviewed",
      "Follow-up decision is recorded by a human reviewer",
    ],
  },
  "cable-sheath-02": {
    id: "WO-DEMO-002",
    title: "Instructor review of marked training prop cable",
    summary: "Flag the training prop for instructor review and keep it out of use in the simulated scenario.",
    owner: "Demo Training Team",
    checklist: [
      { id: "check-1", label: "Confirm the prop at training bench 04" },
      { id: "check-2", label: "Mark the prop as out of use in the simulated scenario" },
      { id: "check-3", label: "Record the instructor's review decision" },
    ],
    acceptanceCriteria: [
      "Observation and unknowns have been reviewed",
      "Instructor decision is recorded by a human reviewer",
    ],
  },
  "handrail-bracket-03": {
    id: "WO-DEMO-003",
    title: "Instructor inspection of mock handrail rig",
    summary: "Mark the mock rig for inspection by an instructor.",
    owner: "Demo Training Team",
    checklist: [
      { id: "check-1", label: "Confirm the fixture on the mock stairwell rig" },
      { id: "check-2", label: "Mark the mock rig for instructor inspection" },
      { id: "check-3", label: "Record the instructor's inspection decision" },
    ],
    acceptanceCriteria: [
      "Observation and unknowns have been reviewed",
      "Inspection decision is recorded by a human reviewer",
    ],
  },
  "pipework-corrosion-04": {
    id: "WO-DEMO-004",
    title: "Review reported pipe joint corrosion",
    summary: "Review the observation and determine whether a qualified inspection is needed.",
    owner: "Demo Maintenance Team",
    checklist: [
      { id: "check-1", label: "Confirm the reported joint in plant room 2" },
      { id: "check-2", label: "Review the source photo and note" },
      { id: "check-3", label: "Record a qualified follow-up decision" },
    ],
    acceptanceCriteria: [
      "Observation and unknowns have been reviewed",
      "Follow-up decision is recorded by a human reviewer",
    ],
  },
  "concrete-spalling-05": {
    id: "WO-DEMO-005",
    title: "Review reported concrete deterioration",
    summary: "Review the observation and determine whether a qualified inspection is needed.",
    owner: "Demo Facilities Team",
    checklist: [
      { id: "check-1", label: "Confirm the reported location on support column 5" },
      { id: "check-2", label: "Review the source photo and note" },
      { id: "check-3", label: "Record a qualified follow-up decision" },
    ],
    acceptanceCriteria: [
      "Observation and unknowns have been reviewed",
      "Follow-up decision is recorded by a human reviewer",
    ],
  },
};
