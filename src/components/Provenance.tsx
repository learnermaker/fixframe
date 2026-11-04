import type { Provenance } from "../lib/contracts";

const CHIP_STYLES: Record<Provenance["source"], string> = {
  LIVE_META: "bg-signal text-white",
  DEMO_FIXTURE: "bg-tag text-graphite",
  USER_EDIT: "bg-marker text-white",
};

export function SourceChip({ source }: { source: Provenance["source"] }) {
  return <span className={`inline-block rounded-sm px-1.5 text-xs font-semibold ${CHIP_STYLES[source]}`}>{source}</span>;
}

/** One chip per origin, with the model and request or fixture ID behind each result. */
export function ProvenanceList({ items }: { items: Provenance[] }) {
  return (
    <ul className="space-y-1 text-sm text-slate">
      {items.map((p, index) => (
        <li key={index} className="flex flex-wrap items-center gap-x-2">
          <SourceChip source={p.source} />
          <span>{p.model ?? "Reviewer"}</span>
          {p.fixtureId && <span>{p.fixtureId}</span>}
          {p.requestId && <span>Request {p.requestId}</span>}
        </li>
      ))}
    </ul>
  );
}
