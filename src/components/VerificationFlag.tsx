import type { EligibilityResult } from "@/lib/types";

export function VerificationFlag({ result }: { result: EligibilityResult }) {
  if (result.verified) return null;
  return <p className="status-note">Figures pending verification against the policy PDF. Final eligibility is determined by the hospital.</p>;
}