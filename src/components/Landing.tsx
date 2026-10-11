import Link from "next/link";
import { HeroArt } from "./HeroArt";
import { StepsScroller } from "./StepsScroller";
import { ArrowRight, Check, Doc, Link2, Shield } from "./Icons";

const FACTS = [
  { k: "3", v: "Georgia health systems read so far" },
  { k: "2 min", v: "from bill to your number" },
  { k: "0", v: "accounts, logins or fees" },
];

export function Landing() {
  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="shell hero-grid">
          <div className="hero-copy">
            <p className="eyebrow" data-reveal><span className="dot" /> Hospital financial assistance, explained</p>
            <h1 id="hero-title" className="hero-title" data-reveal style={{ ["--d" as string]: "80ms" }}>
              A bill is a number.<br />
              <em>It isn&apos;t the whole story.</em>
            </h1>
            <p className="hero-lede" data-reveal style={{ ["--d" as string]: "160ms" }}>
              Nonprofit hospitals are required by federal law to offer financial assistance. We read their policies so you don&apos;t have to, then show what your bill may become.
            </p>
            <div className="hero-actions" data-reveal style={{ ["--d" as string]: "240ms" }}>
              <Link className="btn btn-lg" href="/?begin=1">
                Begin with your bill <ArrowRight />
              </Link>
              <Link className="btn-text" href="#how">See how it works</Link>
            </div>
            <p className="hero-assure" data-reveal style={{ ["--d" as string]: "320ms" }}>
              <Shield width={16} height={16} /> Free · No account · Nothing is stored
            </p>
          </div>
          <HeroArt />
        </div>
        <div className="hero-fade" aria-hidden="true" />
      </section>

      <section className="facts" aria-label="At a glance">
        <div className="shell facts-row">
          {FACTS.map((f, i) => (
            <div className="fact" key={f.v} data-reveal style={{ ["--d" as string]: `${i * 90}ms` }}>
              <strong>{f.k}</strong>
              <span>{f.v}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="problem section" aria-labelledby="problem-title">
        <div className="shell problem-grid">
          <div data-reveal>
            <p className="eyebrow eyebrow-dark"><span className="dot" /> The gap</p>
            <h2 id="problem-title" className="h2">The help exists. <em>The map doesn&apos;t.</em></h2>
          </div>
          <div className="problem-copy">
            <p data-reveal>Every nonprofit hospital publishes a financial assistance policy. They run to dozens of pages of income tiers, residency rules and exceptions, and almost nobody connects them to their own bill.</p>
            <p data-reveal style={{ ["--d" as string]: "100ms" }}>Covered does that step. It uses the Federal Poverty Level, finds your tier in the hospital&apos;s own document, and links to the exact source so you can check our work.</p>
          </div>
        </div>
      </section>

      <StepsScroller />

      <section id="trust" className="trust section" aria-labelledby="trust-title">
        <div className="shell">
          <div className="trust-head" data-reveal>
            <p className="eyebrow"><span className="dot" /> Why you can trust the number</p>
            <h2 id="trust-title" className="h2 h2-light">Plain language. <em>Visible sources.</em></h2>
          </div>
          <div className="trust-grid">
            <article className="trust-card" data-reveal>
              <span className="trust-icon"><Link2 /></span>
              <h3>Every figure has a link</h3>
              <p>Each result points to the hospital&apos;s own policy document and its date. If we can&apos;t verify a figure yet, we say so on the page.</p>
            </article>
            <article className="trust-card" data-reveal style={{ ["--d" as string]: "100ms" }}>
              <span className="trust-icon"><Doc /></span>
              <h3>When documents disagree, we show you</h3>
              <p>Hospitals sometimes contradict themselves. We flag it with both sources instead of picking a winner quietly.</p>
            </article>
            <article className="trust-card" data-reveal style={{ ["--d" as string]: "200ms" }}>
              <span className="trust-icon"><Check /></span>
              <h3>An estimate, never a promise</h3>
              <p>Only the hospital decides eligibility. We help you arrive prepared, with a filled-out application and a document checklist.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="finale section" aria-labelledby="finale-title">
        <div className="shell finale-inner" data-reveal>
          <h2 id="finale-title" className="finale-title">Start with one number.<br /><em>Leave with a path.</em></h2>
          <Link className="btn btn-lg btn-light" href="/?begin=1">
            Begin with your bill <ArrowRight />
          </Link>
        </div>
      </section>
    </>
  );
}
