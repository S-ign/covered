import type { Metadata } from "next";
import "./globals.css";
import { APP_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: APP_NAME,
  description: "See what a hospital's own financial assistance policy may mean for your bill.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="shell header-inner">
            <a href="/" className="brand" aria-label={`${APP_NAME} home`}><span className="brand-mark" aria-hidden="true">G</span><span>{APP_NAME}</span></a>
            <span className="header-note">Policy-based, not a promise</span>
          </div>
        </header>
        <main className="shell page-shell">{children}</main>
        <footer className="shell site-footer"><span>Generations Covered</span><span>Final eligibility is determined by the hospital.</span></footer>
      </body>
    </html>
  );
}