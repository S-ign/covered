import { Suspense } from "react";
import { Landing } from "@/components/Landing";
import { IntakeWizard } from "@/components/IntakeWizard";
import { HomeSwitch } from "@/components/HomeSwitch";

export default function Home() {
  return (
    <Suspense fallback={<div className="shell page-pad"><p className="loading-line">Getting things ready…</p></div>}>
      <HomeSwitch landing={<Landing />} intake={<IntakeWizard />} />
    </Suspense>
  );
}
