import { PDFDocument, PDFFont, StandardFonts, rgb } from "pdf-lib";
import { APP_NAME } from "../config";
import type { Applicant, EligibilityResult } from "../types";

const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const clip = (s: string) => (s.length > 90 ? s.slice(0, 87) + "..." : s);

const INSURANCE_LABEL = {
  uninsured: "No insurance",
  underinsured: "Insured, unable to afford the bill",
} as const;

export function tierDescription(r: EligibilityResult): string {
  const t = r.tier_matched;
  if (!t) return "No published tier matched this household.";
  const cap = t.max_fpl_pct === null ? "any income above the free-care line" : `up to ${t.max_fpl_pct}% of the Federal Poverty Level`;
  const amount = t.discount_pct === null ? "discount set by the hospital's sliding scale" : `${t.discount_pct}% discount`;
  return `${amount}, ${cap}${t.note ? `. ${t.note}` : ""}`;
}

export async function renderApplicationPdf(r: EligibilityResult, a: Applicant): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const left = 54;
  let y = 740;

  const line = (text: string, opts: { size?: number; font?: PDFFont; gap?: number; x?: number } = {}) => {
    const size = opts.size ?? 11;
    page.drawText(clip(text), { x: opts.x ?? left, y, size, font: opts.font ?? font });
    y -= size + (opts.gap ?? 5);
  };
  const heading = (text: string) => {
    y -= 8;
    line(text, { size: 13, font: bold });
  };

  line(`Financial Assistance Application: ${r.hospital_name}`, { size: 18, font: bold, gap: 4 });
  line(`Prepared with ${APP_NAME} on ${new Date().toISOString().slice(0, 10)}`, { size: 9, gap: 10 });

  heading("Applicant");
  line(`Name: ${a.full_name}`);
  a.mailing_address.split("\n").forEach((addr, i) => line(i === 0 ? `Mailing address: ${addr}` : addr, { x: i === 0 ? left : left + 92 }));
  line(`Phone: ${a.phone}`);
  line(`Date of birth: ${a.date_of_birth}`);

  heading("Household");
  line(`Household size: ${r.household_size}`);
  line(`Annual household income: ${usd(r.annual_income)}`);
  line(`Insurance: ${INSURANCE_LABEL[r.insurance_status]}`);
  line(`County of residence: ${r.county}, ${r.state}`);

  heading("Eligibility under the hospital's published policy");
  line(`Income is ${r.fpl_pct}% of the Federal Poverty Level (FPL for ${r.household_size}: ${usd(r.fpl_base)})`);
  line(`Tier: ${tierDescription(r)}`);
  line(`Bill before assistance: ${usd(r.bill_before)}`);
  line(`Estimated bill after assistance: ${r.bill_after === null ? "Determined by the hospital" : usd(r.bill_after)}`);

  heading("Documents to include");
  for (const d of r.documents_required) {
    page.drawRectangle({ x: left, y: y - 1, width: 10, height: 10, borderWidth: 1, borderColor: rgb(0, 0, 0) });
    page.drawText(clip(d), { x: left + 16, y, size: 11, font });
    y -= 16;
  }

  heading("Where to send");
  line(r.mailing_address ?? "See the hospital's financial assistance policy for the mailing address.");

  page.drawText(clip(`Figures from ${r.hospital_name}'s financial assistance policy (${r.policy_date}).`), { x: left, y: 52, size: 8, font });
  page.drawText(clip(r.source_url), { x: left, y: 42, size: 8, font });
  page.drawText("Final eligibility is determined by the hospital.", { x: left, y: 32, size: 8, font });

  return doc.save();
}
