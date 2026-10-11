import type { EligibilityResult } from "@/lib/types";
import { usd } from "./format";
import { CountUp } from "./CountUp";
import { Check, Scale, Warning } from "./Icons";

export function ResultHeadline({ result }: { result: EligibilityResult }) {
  const hospital = result.hospital_name;

  if (result.status === "free" || result.status === "discounted") {
    const free = result.status === "free";
    const pct = result.tier_matched?.discount_pct ?? 0;
    const after = result.bill_after ?? 0;
    const saved = result.bill_before - after;
    return (
      <div className="headline">
        <p className="headline-kicker">
          <span className="pill pill-good"><Check width={14} height={14} /> {free ? "Full assistance" : `${pct}% assistance`}</span>
          <span>{hospital}</span>
        </p>
        <h1 className="headline-title">
          <span className="headline-before">Your <s>{usd(result.bill_before)}</s> bill may drop to</span>
          <CountUp className="headline-amount" from={result.bill_before} to={after} />
        </h1>
        <p className="headline-copy">
          That is <strong>{pct}% off</strong> under {hospital}&apos;s published policy, a difference of <strong>{usd(saved)}</strong>.
          The hospital makes the final decision.
        </p>
        <div className="saved-bar" aria-hidden="true">
          <span className="saved-fill" style={{ ["--w" as string]: `${Math.max(3, pct)}%` }} />
          <small><b>{usd(saved)}</b> covered by assistance</small>
          <small><b>{usd(after)}</b> you may owe</small>
        </div>
      </div>
    );
  }

  if (result.status === "eligible_sliding_scale") {
    return (
      <div className="headline">
        <p className="headline-kicker">
          <span className="pill pill-good"><Scale width={14} height={14} /> Sliding scale</span>
          <span>{hospital}</span>
        </p>
        <h1 className="headline-title headline-title-text">You qualify for assistance.</h1>
        <p className="headline-copy">
          {hospital} sets the discount on a sliding scale, and its published information doesn&apos;t give a dollar figure.
          Use the steps below to apply and ask for your exact amount.
        </p>
      </div>
    );
  }

  return (
    <div className="headline">
      <p className="headline-kicker">
        <span className="pill pill-warn"><Warning width={14} height={14} /> Needs a call</span>
        <span>{hospital}</span>
      </p>
      <h1 className="headline-title headline-title-text">No published tier matches.</h1>
      <p className="headline-copy">
        Call {hospital}&apos;s financial counselor. Hospitals can often explain exceptions and other options that aren&apos;t in the policy tables.
      </p>
    </div>
  );
}
