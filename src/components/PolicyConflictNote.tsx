import type { EligibilityResult } from "@/lib/types";

export function PolicyConflictNote({ result }: { result: EligibilityResult }) {
  if (!result.policy_conflicts.length) return null;
  return <div className="conflict"><h2>The hospital&apos;s own documents disagree</h2>{result.policy_conflicts.map((conflict) => <div className="conflict-item" key={conflict.source_url}><p><strong>{conflict.claim}</strong></p><p>{conflict.note}</p><a href={conflict.source_url} target="_blank" rel="noreferrer">See the page that says so</a></div>)}</div>;
}