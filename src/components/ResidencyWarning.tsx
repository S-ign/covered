import type { EligibilityResult } from "@/lib/types";

export function ResidencyWarning({ result }: { result: EligibilityResult }) {
  if (result.residency_ok || result.residency.type === "none") return null;
  return <div className="warning"><strong>Residency check.</strong> {result.hospital_name}&apos;s policy covers {result.residency.values.join(" and ")} residents. You entered {result.county}. Call them to ask about exceptions.</div>;
}