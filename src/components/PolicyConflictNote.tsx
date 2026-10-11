import type { EligibilityResult } from "@/lib/types";
import { Doc } from "./Icons";

export function PolicyConflictNote({ result }: { result: EligibilityResult }) {
  if (!result.policy_conflicts.length) return null;
  return (
    <div className="callout callout-conflict" role="note" data-reveal>
      <span className="callout-icon"><Doc /></span>
      <div>
        <strong>The hospital&apos;s own documents disagree</strong>
        {result.policy_conflicts.map((c) => (
          <div className="conflict-item" key={c.source_url}>
            <p className="conflict-claim">{c.claim}</p>
            <p>{c.note}</p>
            <a href={c.source_url} target="_blank" rel="noreferrer">See the page that says so</a>
          </div>
        ))}
      </div>
    </div>
  );
}
