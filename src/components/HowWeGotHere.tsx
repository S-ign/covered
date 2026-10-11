import type { EligibilityResult } from "@/lib/types";
import { usd } from "./format";
import { Link2 } from "./Icons";

export function HowWeGotHere({ result }: { result: EligibilityResult }) {
  const tier = result.tier_matched;
  const max = Math.max(400, Math.ceil((result.fpl_pct + 40) / 50) * 50);
  const marker = Math.min(96, Math.max(4, (result.fpl_pct / max) * 100));
  const cap = tier?.max_fpl_pct ?? null;
  const capPos = cap === null ? 100 : Math.min(100, (cap / max) * 100);
  const tierText = tier
    ? `${tier.discount_pct === null ? "a sliding-scale assistance tier" : `${tier.discount_pct}% assistance`}${cap === null ? "" : `, for incomes up to ${cap}% of the poverty level`}`
    : null;

  return (
    <section className="block" aria-labelledby="how-got-here" data-reveal>
      <p className="eyebrow eyebrow-dark"><span className="dot" /> The math</p>
      <h2 id="how-got-here" className="h2 h2-sm">How we got here</h2>

      <div className="gauge-card">
        <div className="gauge-top">
          <div>
            <span className="gauge-big">{result.fpl_pct}%</span>
            <span className="gauge-cap">of the Federal Poverty Level</span>
          </div>
          <p className="gauge-explain">
            {usd(result.annual_income)} a year for {result.household_size} {result.household_size === 1 ? "person" : "people"}, measured against a poverty line of {usd(result.fpl_base)}.
          </p>
        </div>
        <div className="gauge" role="img" aria-label={`You are at ${result.fpl_pct}% of the poverty level${cap !== null ? `; the matched tier covers up to ${cap}%` : ""}.`}>
          <div className="gauge-track">
            <span className="gauge-zone" style={{ ["--zone" as string]: `${capPos}%` }} />
            {cap !== null && cap < max && (
              <span className="gauge-cap-tick" style={{ left: `${capPos}%` }}><em>Tier limit {cap}%</em></span>
            )}
            <span className="gauge-marker" style={{ left: `${marker}%` }}><i>You · {result.fpl_pct}%</i></span>
          </div>
          <div className="gauge-scale" aria-hidden="true">
            <span>0%</span><span>{Math.round(max / 2)}%</span><span>{max}%</span>
          </div>
        </div>
        <p className="gauge-tier">
          {tierText
            ? <>{result.hospital_name}&apos;s policy gives you <strong>{tierText}</strong>.</>
            : <>No tier in {result.hospital_name}&apos;s published policy covers this combination.</>}
        </p>
      </div>

      <p className="source-line">
        <Link2 width={16} height={16} />
        <span>
          Source:{" "}
          <a href={result.source_url} target="_blank" rel="noreferrer">{result.hospital_name} financial assistance policy</a>
          {result.policy_date !== "unknown" && `, ${result.policy_date}`}
        </span>
      </p>
    </section>
  );
}
