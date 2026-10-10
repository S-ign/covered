import type { HospitalPolicy } from "@/lib/types";

export function SourcesFooter({ hospitals }: { hospitals: HospitalPolicy[] }) {
  return <section className="result-section"><h2>Sources</h2><ul className="result-list">{hospitals.map((hospital) => <li key={hospital.id}><a href={hospital.policy_url} target="_blank" rel="noreferrer">{hospital.name} financial assistance policy</a></li>)}</ul></section>;
}