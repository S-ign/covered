import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import "./globals.css";
import { APP_NAME } from "@/lib/config";
import { RevealObserver } from "@/components/RevealObserver";

const display = localFont({
  src: [
    { path: "./fonts/Fraunces.woff2", style: "normal", weight: "100 900" },
    { path: "./fonts/Fraunces-Italic.woff2", style: "italic", weight: "100 900" },
  ],
  variable: "--font-display",
  display: "swap",
});

const body = localFont({
  src: [{ path: "./fonts/InstrumentSans.woff2", style: "normal", weight: "400 700" }],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${APP_NAME} · What your hospital's policy says about your bill`,
  description:
    "Nonprofit hospitals must offer financial assistance. Covered reads their policies and shows what your bill may drop to, then prepares your application.",
};

export const viewport: Viewport = { themeColor: "#0e2420", width: "device-width", initialScale: 1 };

function Mark() {
  return (
    <svg viewBox="0 0 40 40" width="34" height="34" aria-hidden="true" className="brand-mark">
      <circle cx="20" cy="20" r="18" fill="#0e2420" />
      <path d="M26.5 14.2A9.6 9.6 0 1 0 26.5 25.8" fill="none" stroke="#f3a712" strokeWidth="3.6" strokeLinecap="round" />
      <circle cx="26.8" cy="20" r="2.2" fill="#f4eee2" />
    </svg>
  );
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <div className="scroll-progress" aria-hidden="true" />
        <a className="skip-link" href="#main">Skip to content</a>
        <header className="site-header">
          <div className="shell header-inner">
            <Link href="/" className="brand" aria-label={`${APP_NAME} home`}>
              <Mark />
              <span className="brand-name">{APP_NAME}</span>
            </Link>
            <nav className="header-nav" aria-label="Primary">
              <Link className="nav-link" href="/#how">How it works</Link>
              <Link className="nav-link" href="/#trust">Our sources</Link>
              <Link className="btn btn-sm" href="/?begin=1">Check my bill</Link>
            </nav>
          </div>
        </header>
        <main id="main">{children}</main>
        <footer className="site-footer">
          <div className="shell footer-inner">
            <div>
              <p className="footer-brand">{APP_NAME}</p>
              <p className="footer-note">Estimates come from each hospital&apos;s published financial assistance policy. Final eligibility is always determined by the hospital.</p>
            </div>
            <p className="footer-fine">Georgia · Piedmont, Emory &amp; Grady</p>
          </div>
        </footer>
        <RevealObserver />
      </body>
    </html>
  );
}
