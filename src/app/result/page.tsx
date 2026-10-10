"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { EligibilityInput, EligibilityResult, HospitalPolicy, InsuranceStatus } from "@/lib/types";
import { ResultView } from "@/components/ResultView";
import { HospitalSwitcher } from "@/components/HospitalSwitcher";
import { ApplicationPanel } from "@/components/ApplicationPanel";

function ResultLoader() {
  const params = useSearchParams();
  const query = params.toString();
  const input = useMemo<EligibilityInput>(() => ({ hospital_id: params.get("hospital") ?? "", household_size: Number(params.get("size")), annual_income: Number(params.get("income")), bill_amount: Number(params.get("bill")), insurance_status: (params.get("insurance") ?? "uninsured") as InsuranceStatus, county: params.get("county") ?? "", state: "GA" }), [query, params]);
  const [result, setResult] = useState<EligibilityResult | null>(null);
  const [hospitals, setHospitals] = useState<HospitalPolicy[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetch("/api/hospitals").then((response) => response.json()).then((data) => setHospitals(data.hospitals ?? [])).catch(() => setHospitals([])); }, []);
  useEffect(() => {
    setResult(null); setError(null);
    fetch("/api/eligibility", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) }).then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error ?? `Request failed (${response.status})`); return data as EligibilityResult; }).then(setResult).catch((caught: Error) => setError(caught.message));
  }, [query, input]);

  if (error) return <div><p className="error-text" role="alert">Something is off with the numbers: {error}</p><a className="back-link" href="/">Go back and try again</a></div>;
  if (!result) return <p className="loading-line" aria-live="polite">Checking {input.hospital_id || "the hospital"}&apos;s policy…</p>;
  return <ResultView result={result} hospitals={hospitals}><HospitalSwitcher hospitals={hospitals} current={result.hospital} /><ApplicationPanel result={result} input={input} /></ResultView>;
}

export default function ResultPage() { return <Suspense fallback={<p className="loading-line">Checking the policy…</p>}><ResultLoader /></Suspense>; }