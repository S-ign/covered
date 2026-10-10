import type { EligibilityResult } from "@/lib/types";
import { usd } from "./format";

export function ResultHeadline({ result }: { result: EligibilityResult }) {
  if (result.status === "free" || result.status === "discounted") {
    return <div><p className="result-kicker">Your {usd(result.bill_before)} bill may drop to</p><p className="result-amount">{usd(result.bill_after ?? 0)}</p><p className="result-copy">That is a <strong>{result.tier_matched?.discount_pct}% discount</strong> under {result.hospital_name}&apos;s published policy. The hospital makes the final determination.</p></div>;
  }
  if (result.status === "eligible_sliding_scale") {
    return <div><p className="result-amount" style={{ fontSize: "clamp(2.5rem, 11vw, 5rem)", letterSpacing: "-.06em" }}>You may qualify.</p><p className="result-copy">{result.hospital_name} sets the assistance amount on a sliding scale. We can&apos;t calculate the amount from the published information.</p></div>;
  }
  return <div><p className="result-amount" style={{ fontSize: "clamp(2.5rem, 11vw, 5rem)", color: "var(--ink)", letterSpacing: "-.06em" }}>More review is needed.</p><p className="result-copy">No published tier matched this situation. A hospital financial counselor may still be able to explain exceptions or other options.</p></div>;
}