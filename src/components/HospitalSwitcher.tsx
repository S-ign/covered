"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { HospitalPolicy } from "@/lib/types";

export function HospitalSwitcher({ hospitals, current }: { hospitals: HospitalPolicy[]; current: string }) {
  const router = useRouter();
  const params = useSearchParams();
  function change(id: string) {
    const next = new URLSearchParams(params.toString());
    next.set("hospital", id);
    router.push(`/result?${next.toString()}`);
  }
  if (!hospitals.length) return null;
  return (
    <div className="switcher">
      <p className="switcher-label" id="switcher-label">What if the bill were from a different hospital?</p>
      <div className="switch-tabs" role="radiogroup" aria-labelledby="switcher-label">
        {hospitals.map((h) => (
          <button
            key={h.id}
            type="button"
            role="radio"
            aria-checked={h.id === current}
            className={`switch-tab${h.id === current ? " is-on" : ""}`}
            onClick={() => h.id !== current && change(h.id)}
          >
            {h.name.replace(/ (Healthcare|Health System)$/, "")}
          </button>
        ))}
      </div>
    </div>
  );
}
