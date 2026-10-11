"use client";

import { useEffect, useRef, useState } from "react";

const STEPS = [
  { n: "01", title: "Tell us about the bill", body: "Pick the hospital, enter the amount, and share your household size, yearly income, insurance and county. It takes about two minutes and nothing is saved." },
  { n: "02", title: "See the policy answer", body: "We turn your income into a percent of the Federal Poverty Level and place you on the hospital's own assistance scale, step by step, with the source one tap away." },
  { n: "03", title: "Take the next step", body: "Download a clean application with your details filled in, a checklist of documents to attach, and the address to send it to." },
];

function Visual({ step }: { step: number }) {
  return (
    <div className="steps-visual" data-step={step} role="img" aria-label={`Step ${step + 1} of 3`}>
      <svg viewBox="0 0 400 400" aria-hidden="true">
        <circle cx="200" cy="200" r="170" className="sv-ring" />
        <circle cx="200" cy="200" r="120" className="sv-ring sv-ring-2" />
        <g className="sv-scene sv-scene-0">
          <rect x="112" y="92" width="176" height="216" rx="14" fill="#f4eee2" />
          <rect x="132" y="120" width="70" height="8" rx="4" fill="#0e2420" opacity=".8" />
          <rect x="132" y="146" width="136" height="6" rx="3" fill="#0e2420" opacity=".18" />
          <rect x="132" y="164" width="116" height="6" rx="3" fill="#0e2420" opacity=".18" />
          <rect x="132" y="182" width="126" height="6" rx="3" fill="#0e2420" opacity=".18" />
          <rect x="132" y="246" width="136" height="38" rx="9" fill="#f3a712" />
          <text x="200" y="272" textAnchor="middle" fontFamily="var(--font-display)" fontSize="22" fontWeight="600" fill="#0e2420">$9,400</text>
        </g>
        <g className="sv-scene sv-scene-1">
          <path d="M70 300h260" stroke="#f4eee2" strokeOpacity=".35" strokeWidth="2" />
          <rect x="92" y="212" width="44" height="88" rx="8" fill="#2f6b4f" />
          <rect x="150" y="172" width="44" height="128" rx="8" fill="#2f6b4f" />
          <rect x="208" y="130" width="44" height="170" rx="8" fill="#f3a712" />
          <rect x="266" y="96" width="44" height="204" rx="8" fill="#2f6b4f" opacity=".55" />
          <path d="M70 168h260" stroke="#e8664d" strokeWidth="3" strokeDasharray="7 7" />
          <circle cx="230" cy="168" r="10" fill="#e8664d" />
        </g>
        <g className="sv-scene sv-scene-2">
          <rect x="120" y="84" width="160" height="220" rx="14" fill="#f4eee2" />
          <rect x="142" y="112" width="96" height="8" rx="4" fill="#0e2420" opacity=".8" />
          {[148, 184, 220].map((y) => (<g key={y}><rect x="142" y={y} width="18" height="18" rx="5" fill="none" stroke="#0e2420" strokeWidth="2.4" /><rect x="170" y={y + 5} width="86" height="7" rx="3.5" fill="#0e2420" opacity=".2" /></g>))}
          <path d="m145 157 4 5 8-10" fill="none" stroke="#2f6b4f" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="m145 193 4 5 8-10" fill="none" stroke="#2f6b4f" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="142" y="258" width="116" height="30" rx="15" fill="#0e2420" />
          <path d="m316 214 40-40m0 0h-26m26 0v26" fill="none" stroke="#f3a712" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
    </div>
  );
}

export function StepsScroller() {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index));
        }
      },
      { rootMargin: "-42% 0px -42% 0px", threshold: 0 },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section id="how" className="steps section" aria-labelledby="how-title">
      <div className="shell steps-grid">
        <div className="steps-sticky">
          <p className="eyebrow eyebrow-dark"><span className="dot" /> How it works</p>
          <h2 id="how-title" className="h2">Three small steps. <em>One clear answer.</em></h2>
          <Visual step={active} />
        </div>
        <ol className="steps-list">
          {STEPS.map((s, i) => (
            <li
              key={s.n}
              ref={(el) => { refs.current[i] = el; }}
              data-index={i}
              className={`step-card${active === i ? " is-active" : ""}`}
            >
              <span className="step-num">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
