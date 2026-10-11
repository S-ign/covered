import type { EligibilityResult, HospitalPolicy } from "@/lib/types";
import { ResultHeadline } from "./ResultHeadline";
import { HowWeGotHere } from "./HowWeGotHere";
import { ResidencyWarning } from "./ResidencyWarning";
import { PolicyConflictNote } from "./PolicyConflictNote";
import { VerificationFlag } from "./VerificationFlag";
import { SourcesFooter } from "./SourcesFooter";

export function ResultView({
  result,
  hospitals,
  switcher,
  application,
}: {
  result: EligibilityResult;
  hospitals: HospitalPolicy[];
  switcher?: React.ReactNode;
  application?: React.ReactNode;
}) {
  return (
    <div className="result">
      <section className="result-hero">
        <div className="shell result-hero-inner">
          <ResultHeadline result={result} />
          {switcher}
          <VerificationFlag result={result} />
        </div>
      </section>
      <div className="shell result-body">
        <ResidencyWarning result={result} />
        <PolicyConflictNote result={result} />
        <HowWeGotHere result={result} />
        {application}
        <SourcesFooter hospitals={hospitals} />
      </div>
    </div>
  );
}
