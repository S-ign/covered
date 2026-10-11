"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { EligibilityInput, EligibilityResult, HospitalPolicy, InsuranceStatus } from "@/lib/types";
import { ResultView } from "@/components/ResultView";
import { HospitalSwitcher } from "@/components/HospitalSwitcher";
import { ApplicationPanel } from "@/components/ApplicationPanel";
import { ArrowLeft } from "@/components/Icons";

function Loading({ name }: { name?: string }) {
  return (
    <div className="shell page-pad state-box" aria-live="polite">
      <span className="loader" aria-hidden="true" />
      <p className="loading-line">Checking {name ? `${name}'s` : "the hospital's"} policy…</p>
    </div>
  );
}

function ResultLoader() {
  const params = useSearchParams();
  const query = params.toString();
  const input = useMemo<EligibilityInput>(
    () => ({
      hospital_id: params.get("hospital") ?? "",
      household_size: Number(params.get("size")),
      annual_income: Number(params.get("income")),
      bill_amount: Number(params.get("bill")),
      insurance_status: (params.get("insurance") ?? "uninsured") as InsuranceStatus,
      county: params.get("county") ?? "",
      state: "GA",
    }),
    [params],
  );
  const [result, setResult] = useState<EligibilityResult | null>(null);
  const [hospitals, setHospitals] = useState<HospitalPolicy[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/hospitals")
      .then((response) => response.json())
      .then((data) => setHospitals(data.hospitals ?? []))
      .catch(() => setHospitals([]));
  }, []);

  useEffect(() => {
    setResult(null);
    setError(null);
    fetch("/api/eligibility", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? `Request failed (${response.status})`);
        return data as EligibilityResult;
      })
      .then(setResult)
      .catch((caught: Error) => setError(caught.message));
  }, [query, input]);

  if (error) {
    return (
      <div className="shell page-pad state-box" role="alert">
        <h1 className="h1">Something is off with the numbers.</h1>
        <p className="sub">{error}</p>
        <Link className="btn btn-lg" href="/?begin=1"><ArrowLeft /> Go back and try again</Link>
      </div>
    );
  }
  if (!result) return <Loading name={hospitals.find((h) => h.id === input.hospital_id)?.name} />;
  return (
    <ResultView
      result={result}
      hospitals={hospitals}
      switcher={<HospitalSwitcher hospitals={hospitals} current={result.hospital} />}
      application={<ApplicationPanel result={result} input={input} />}
    />
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ResultLoader />
    </Suspense>
  );
}
