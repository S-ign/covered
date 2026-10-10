import type { EligibilityResult } from "@/lib/types";
import { usd } from "./format";

export function HowWeGotHere({ result }: { result: EligibilityResult }) {
  const tier = result.tier_matched;
  return <section className="result-section"><h2>How we got here</h2><ul className="result-list"><li>A household of {result.household_size} earning {usd(result.annual_income)} a year.</li><li>That is <strong>{result.fpl_pct}%</strong> of the Federal Poverty Level ({usd(result.fpl_base)} for this household size).</li><li>{tier ? `${result.hospital_name}'s policy matches ${tier.discount_pct === null ? "a sliding-scale assistance tier" : `${tier.discount_pct}% assistance`}${tier.max_fpl_pct === null ? "" : ` at or below ${tier.max_fpl_pct}% of FPL`}.` : `No tier in ${result.hospital_name}'s published policy covers this combination.`}</li></ul><p className="quiet-note">Source: <a href={result.source_url} target="_blank" rel="noreferrer">{result.hospital_name} financial assistance policy</a>{result.policy_date !== "unknown" && `, ${result.policy_date}`}</p></section>;
}