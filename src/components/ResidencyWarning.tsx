import type { EligibilityResult } from "@/lib/types";
import { Warning } from "./Icons";

export function ResidencyWarning({ result }: { result: EligibilityResult }) {
  if (result.residency_ok || result.residency.type === "none") return null;
  return (
    <div className="callout callout-warn" role="note" data-reveal>
      <span className="callout-icon"><Warning /></span>
      <div>
        <strong>Residency check</strong>
        <p>{result.hospital_name}&apos;s policy covers {result.residency.values.join(" and ")} residents. You entered {result.county}. Call them to ask about exceptions.</p>
      </div>
    </div>
  );
}
