import type { FplTable, HospitalPolicy } from "./types";

const APPLIES = new Set(["uninsured", "underinsured", "any"]);

export function validateHospitals(hospitals: HospitalPolicy[]): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  hospitals.forEach((h, i) => {
    const at = `hospitals[${i}] (${h.id})`;
    if (!h.id || h.id !== h.id.toLowerCase()) errors.push(`${at}: id must be lowercase`);
    if (seen.has(h.id)) errors.push(`${at}: duplicate id`);
    seen.add(h.id);
    for (const [k, url] of Object.entries({ policy_url: h.policy_url, application_url: h.application_url })) {
      if (!url.startsWith("https://")) errors.push(`${at}: ${k} must start with https://`);
    }
    for (const c of h.policy_conflicts) {
      if (!c.source_url.startsWith("https://")) errors.push(`${at}: policy_conflicts source_url must start with https://`);
    }
    let lastMax = -Infinity;
    let seenNull = false;
    h.tiers.forEach((t, j) => {
      const tat = `${at} tiers[${j}]`;
      if (!APPLIES.has(t.applies_to)) errors.push(`${tat}: applies_to invalid`);
      if (t.discount_pct !== null && (t.discount_pct < 0 || t.discount_pct > 100)) errors.push(`${tat}: discount_pct must be 0..100 or null`);
      if (t.max_fpl_pct === null) {
        seenNull = true;
      } else {
        if (seenNull) errors.push(`${tat}: tiers must be sorted ascending with null last`);
        if (t.max_fpl_pct < lastMax) errors.push(`${tat}: tiers must be sorted ascending by max_fpl_pct`);
        lastMax = t.max_fpl_pct;
      }
    });
  });
  return errors;
}

export function validateFpl(table: FplTable): string[] {
  const errors: string[] = [];
  let last = 0;
  for (let s = 1; s <= 8; s++) {
    const v = table.by_size[String(s)];
    if (typeof v !== "number") {
      errors.push(`by_size.${s} missing`);
      continue;
    }
    if (v <= last) errors.push(`by_size.${s} must be increasing`);
    last = v;
  }
  if (!(table.additional_person > 0)) errors.push("additional_person must be > 0");
  if (!table.source_url.startsWith("https://")) errors.push("source_url must start with https://");
  return errors;
}
