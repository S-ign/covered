import type { HospitalPolicy } from "@/lib/types";
import { ArrowUpRight } from "./Icons";

export function SourcesFooter({ hospitals }: { hospitals: HospitalPolicy[] }) {
  if (!hospitals.length) return null;
  return (
    <section className="block" aria-labelledby="sources-title" data-reveal>
      <p className="eyebrow eyebrow-dark"><span className="dot" /> Check our work</p>
      <h2 id="sources-title" className="h2 h2-sm">Sources</h2>
      <ul className="sources">
        {hospitals.map((h) => (
          <li key={h.id}>
            <a href={h.policy_url} target="_blank" rel="noreferrer">
              <span>{h.name}</span>
              <small>Financial assistance policy{h.policy_date !== "unknown" ? `, ${h.policy_date}` : ""}</small>
              <ArrowUpRight width={18} height={18} />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
