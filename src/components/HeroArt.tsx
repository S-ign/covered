import { CountUp } from "./CountUp";

/**
 * The landing hero illustration, built from SVG and CSS so it stays crisp at any size.
 * A hospital statement is struck through while a "may drop to" card counts the bill down.
 */
export function HeroArt() {
  return (
    <div className="hero-art" role="img" aria-label="Illustration: a $9,400 hospital statement is crossed out and a card shows the bill may drop to $0.">
      <div className="art-parallax" data-speed="0.10">
        <svg className="art-arch" viewBox="0 0 520 600" aria-hidden="true">
          <defs>
            <linearGradient id="archFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#1f4a3f" />
              <stop offset="1" stopColor="#0e2420" />
            </linearGradient>
          </defs>
          <path d="M20 600V260C20 112 128 20 260 20s240 92 240 240v340H20Z" fill="url(#archFill)" />
          <g fill="none" stroke="#f3a712" strokeOpacity=".28" strokeWidth="1.5">
            <circle cx="260" cy="250" r="118" />
            <circle cx="260" cy="250" r="168" />
            <circle cx="260" cy="250" r="218" />
          </g>
          <g fill="#f3a712">
            <circle cx="260" cy="76" r="9" />
            <circle cx="92" cy="300" r="5" opacity=".7" />
            <circle cx="430" cy="196" r="6" opacity=".8" />
          </g>
          <g transform="translate(0 428)" aria-hidden="true">
            <path d="M0 80c70-52 150-60 260-24s190 24 260-20v136H0V80Z" fill="#2f6b4f" opacity=".55" />
            <path d="M0 112c90-40 170-34 270-4s170 20 250-16v108H0v-88Z" fill="#183a32" />
          </g>
        </svg>
      </div>

      <div className="art-parallax art-bill-wrap" data-speed="0.22">
        <div className="bill-sheet">
          <div className="bill-head">
            <span className="bill-cross" aria-hidden="true"><i /><i /></span>
            <span>Hospital statement</span>
            <span className="bill-id">№ 4471-09</span>
          </div>
          <div className="bill-rows" aria-hidden="true">
            <div><span>Emergency visit</span><b>$5,820.00</b></div>
            <div><span>Imaging &amp; labs</span><b>$2,310.00</b></div>
            <div><span>Facility fee</span><b>$1,270.00</b></div>
          </div>
          <div className="bill-due">
            <span>Amount due</span>
            <strong className="bill-amount">
              $9,400
              <svg viewBox="0 0 200 30" preserveAspectRatio="none" aria-hidden="true"><path className="strike" d="M4 18C40 6 80 24 120 12s60-6 76-2" /></svg>
            </strong>
          </div>
        </div>
      </div>

      <div className="art-parallax art-card-wrap" data-speed="0.36">
        <div className="drop-card">
          <span className="drop-label">May drop to</span>
          <CountUp className="drop-number" from={9400} to={0} duration={2400} delay={900} />
          <span className="drop-foot"><i aria-hidden="true" />under the hospital&apos;s own policy</span>
        </div>
      </div>

      <svg className="art-badge" viewBox="0 0 160 160" aria-hidden="true">
        <defs><path id="badgeCircle" d="M80 80m-58 0a58 58 0 1 1 116 0a58 58 0 1 1-116 0" /></defs>
        <circle cx="80" cy="80" r="78" fill="#f3a712" />
        <g className="badge-spin">
          <text fontSize="11.5" fontWeight="700" letterSpacing="3.1" fill="#0e2420">
            <textPath href="#badgeCircle">READ THE POLICY · KNOW YOUR NUMBER · </textPath>
          </text>
        </g>
        <path d="M80 56c1.300 12.500 5.500 18.500 20 23-14.500 4.500-18.700 10.500-20 25-1.300-14.500-5.500-20.500-20-25 14.500-4.500 18.700-10.500 20-23Z" fill="#0e2420" />
      </svg>
    </div>
  );
}
