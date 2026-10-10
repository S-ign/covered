import type { EligibilityResult, HospitalPolicy } from "@/lib/types";
import { ResultHeadline } from "./ResultHeadline";
import { HowWeGotHere } from "./HowWeGotHere";
import { ResidencyWarning } from "./ResidencyWarning";
import { PolicyConflictNote } from "./PolicyConflictNote";
import { VerificationFlag } from "./VerificationFlag";
import { SourcesFooter } from "./SourcesFooter";

export function ResultView({ result, hospitals, children }: { result: EligibilityResult; hospitals: HospitalPolicy[]; children?: React.ReactNode }) {
  return <div className="result-shell"><ResultHeadline result={result} />{children}<ResidencyWarning result={result} /><HowWeGotHere result={result} /><PolicyConflictNote result={result} /><VerificationFlag result={result} /><SourcesFooter hospitals={hospitals} /></div>;
}