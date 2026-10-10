"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { HospitalPolicy } from "@/lib/types";

export function HospitalSwitcher({ hospitals, current }: { hospitals: HospitalPolicy[]; current: string }) {
  const router = useRouter();
  const params = useSearchParams();
  function change(id: string) { const next = new URLSearchParams(params.toString()); next.set("hospital", id); router.push(`/result?${next.toString()}`); }
  return <div className="result-section switcher"><label className="field-label" htmlFor="hospital-switcher">What if the bill were from a different hospital?</label><select id="hospital-switcher" className="field-control" value={current} onChange={(event) => change(event.target.value)}>{hospitals.map((hospital) => <option key={hospital.id} value={hospital.id}>{hospital.name}</option>)}</select></div>;
}