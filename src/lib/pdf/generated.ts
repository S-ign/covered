import { PDFDocument, PDFFont, rgb, LineCapStyle } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { APP_NAME } from "../config";
import type { Applicant, EligibilityResult } from "../types";
import { DISPLAY_B64, SANS_B64, SANS_BOLD_B64 } from "./fonts";

/* Page: US Letter. All layout below is written in "top" coordinates (distance from the top edge). */
const W = 612;
const H = 792;
const M = 54;
const CW = W - M * 2;

/* Palette, shared with the website. */
const c = (r: number, g: number, b: number) => rgb(r / 255, g / 255, b / 255);
const INK = c(14, 36, 32);
const FOREST = c(31, 74, 63);
const GREEN = c(47, 107, 79);
const MINT = c(143, 208, 174);
const AMBER = c(243, 167, 18);
const AMBER_SOFT = c(251, 227, 166);
const CREAM = c(244, 238, 226);
const PAPER = c(250, 246, 236);
const WHITE = c(255, 253, 248);
const MUTED = c(70, 86, 79);

const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

/**
 * The embedded fonts cover Basic Latin, Latin-1 and common punctuation. Strip accents first,
 * then replace anything still outside that range so no glyph silently renders as a blank box.
 */
const SAFE = /[\u0020-\u007E\u00A0-\u00FF\u2010-\u2015\u2018-\u201F\u2022\u2026\u20AC\u2122]/;
function encodable(s: string): string {
  return Array.from(s.normalize("NFKD").replace(/[\u0300-\u036f]/g, ""))
    .map((ch) => (SAFE.test(ch) ? ch : "?"))
    .join("");
}

const INSURANCE_LABEL = {
  uninsured: "No insurance",
  underinsured: "Insured, unable to afford the bill",
} as const;

export function tierDescription(r: EligibilityResult): string {
  const t = r.tier_matched;
  if (!t) return "No published tier matched this household.";
  const cap = t.max_fpl_pct === null ? "any income above the free-care line" : `up to ${t.max_fpl_pct}% of the Federal Poverty Level`;
  const amount = t.discount_pct === null ? "discount set by the hospital's sliding scale" : `${t.discount_pct}% discount`;
  return `${amount}, ${cap}${t.note && !/pulled from|TODO|tbd/i.test(t.note) ? `. ${t.note}` : ""}`;
}

function wrap(text: string, font: PDFFont, size: number, maxW: number): string[] {
  const lines: string[] = [];
  for (const para of text.split(/\r?\n/)) {
    let line = "";
    for (const word of para.split(/\s+/).filter(Boolean)) {
      // Break very long unbroken strings (URLs) so they never run off the page.
      let w = word;
      while (font.widthOfTextAtSize(w, size) > maxW) {
        let n = w.length - 1;
        while (n > 1 && font.widthOfTextAtSize(w.slice(0, n), size) > maxW) n--;
        if (line) { lines.push(line); line = ""; }
        lines.push(w.slice(0, n));
        w = w.slice(n);
      }
      const next = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(next, size) <= maxW) line = next;
      else { lines.push(line); line = w; }
    }
    lines.push(line);
  }
  return lines.filter((l, i, a) => l !== "" || (i > 0 && i < a.length - 1));
}

function roundedPath(w: number, h: number, r: number) {
  return `M ${r} 0 H ${w - r} A ${r} ${r} 0 0 1 ${w} ${r} V ${h - r} A ${r} ${r} 0 0 1 ${w - r} ${h} H ${r} A ${r} ${r} 0 0 1 0 ${h - r} V ${r} A ${r} ${r} 0 0 1 ${r} 0 Z`;
}

export async function renderApplicationPdf(r: EligibilityResult, a: Applicant): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const embed = (b64: string) => doc.embedFont(Buffer.from(b64, "base64"), { subset: true });
  const [display, sans, bold] = await Promise.all([embed(DISPLAY_B64), embed(SANS_B64), embed(SANS_BOLD_B64)]);

  doc.setTitle(encodable(`Financial assistance application: ${r.hospital_name}`));
  doc.setAuthor(APP_NAME);
  doc.setCreator(`${APP_NAME} (covered)`);
  doc.setSubject("Hospital financial assistance application, prepared from the hospital's published policy");

  const page = doc.addPage([W, H]);
  const rect = (x: number, top: number, w: number, h: number, o: { color?: ReturnType<typeof rgb>; border?: ReturnType<typeof rgb>; bw?: number; opacity?: number; bo?: number } = {}) =>
    page.drawRectangle({ x, y: H - top - h, width: w, height: h, color: o.color, borderColor: o.border, borderWidth: o.bw, opacity: o.opacity, borderOpacity: o.bo });
  const rr = (x: number, top: number, w: number, h: number, rad: number, o: { color?: ReturnType<typeof rgb>; border?: ReturnType<typeof rgb>; bw?: number; opacity?: number; bo?: number } = {}) =>
    page.drawSvgPath(roundedPath(w, h, Math.min(rad, h / 2, w / 2)), { x, y: H - top, color: o.color, borderColor: o.border, borderWidth: o.bw, opacity: o.opacity, borderOpacity: o.bo });
  const text = (s: string, x: number, base: number, size: number, font: PDFFont, color = INK, o: { align?: "right" | "center"; opacity?: number } = {}) => {
    const t = encodable(s);
    const w = font.widthOfTextAtSize(t, size);
    const px = o.align === "right" ? x - w : o.align === "center" ? x - w / 2 : x;
    page.drawText(t, { x: px, y: H - base, size, font, color, opacity: o.opacity });
    return w;
  };
  const upper = (s: string) => s.toUpperCase();

  /* Paper */
  rect(0, 0, W, H, { color: PAPER });

  /* ── Header band ── */
  rect(0, 0, W, 140, { color: INK });
  const ringX = W - 84;
  page.drawCircle({ x: ringX, y: H - 92, size: 30, borderColor: AMBER, borderWidth: 1, borderOpacity: 0.28 });
  page.drawCircle({ x: ringX, y: H - 92, size: 18, borderColor: AMBER, borderWidth: 1, borderOpacity: 0.2 });
  page.drawCircle({ x: ringX, y: H - 92, size: 4, color: AMBER });
  // Brand mark, the same arc used in the site header
  page.drawCircle({ x: M + 14, y: H - 40, size: 14, color: FOREST });
  page.drawSvgPath("M26.5 14.2A9.6 9.6 0 1 0 26.5 25.8", { x: M + 14 - 14, y: H - 40 + 14, scale: 0.7, borderColor: AMBER, borderWidth: 3.4, borderLineCap: LineCapStyle.Round });
  page.drawCircle({ x: M + 14 - 14 + 26.8 * 0.7, y: H - 40 + 14 - 20 * 0.7, size: 1.6, color: CREAM });
  text(APP_NAME, M + 36, 46, 19, display, CREAM);
  text(upper("Financial assistance application"), W - M, 44, 7.5, bold, AMBER, { align: "right" });

  text("Application to", M, 80, 9, sans, MINT);
  let nameSize = 27;
  while (nameSize > 16 && display.widthOfTextAtSize(encodable(r.hospital_name), nameSize) > 380) nameSize -= 1;
  text(r.hospital_name, M, 80 + nameSize, nameSize, display, CREAM);
  const date = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
  text(`Prepared with ${APP_NAME} on ${date}`, M, 124, 8.5, sans, CREAM, { opacity: 0.88 });

  /* ── Estimate cards ── */
  const cardTop = 156;
  const cardH = 86;
  rr(M, cardTop, 292, cardH, 16, { color: AMBER });
  text(upper("Estimated bill after assistance"), M + 20, cardTop + 24, 7.5, bold, INK);
  const pct = r.tier_matched?.discount_pct ?? null;
  if (r.bill_after === null) {
    text("Set by the hospital", M + 20, cardTop + 56, 25, display, INK);
    text("Sliding scale: ask them for your exact amount.", M + 20, cardTop + 74, 9, sans, INK);
  } else {
    text(usd(r.bill_after), M + 20, cardTop + 60, 40, display, INK);
    const was = `Bill before assistance ${usd(r.bill_before)}`;
    const ww = text(was, M + 20, cardTop + 76, 9, sans, INK);
    if (pct !== null) text(`  ·  ${pct}% off`, M + 20 + ww, cardTop + 76, 9, bold, INK);
  }
  const rx = M + 292 + 14;
  const rw = CW - 292 - 14;
  rr(rx, cardTop, rw, cardH, 16, { color: FOREST });
  text(`${r.fpl_pct}%`, rx + 20, cardTop + 48, 34, display, AMBER);
  text("of the Federal Poverty Level", rx + 20, cardTop + 63, 8.5, bold, CREAM);
  text(`${usd(r.annual_income)} a year · household of ${r.household_size}`, rx + 20, cardTop + 76, 7.5, sans, CREAM, { opacity: 0.92 });

  /* ── Where you land (mini gauge) ── */
  const gTop = 258;
  text(upper("Where your income lands"), M, gTop + 6, 7, bold, MUTED);
  const maxPct = Math.max(400, Math.ceil((r.fpl_pct + 40) / 50) * 50);
  const cap = r.tier_matched?.max_fpl_pct ?? null;
  const trackTop = gTop + 34;
  rr(M, trackTop, CW, 9, 4.5, { color: INK, opacity: 0.1 });
  const zoneW = Math.max(9, ((cap === null ? maxPct : Math.min(cap, maxPct)) / maxPct) * CW);
  rr(M, trackTop, zoneW, 9, 4.5, { color: MINT });
  if (cap !== null && cap < maxPct) {
    rect(M + zoneW - 0.5, trackTop - 4, 1, 17, { color: INK });
    text(`Tier limit ${cap}%`, M + zoneW, trackTop + 25, 7.5, bold, FOREST, { align: "center" });
  }
  text("0%", M, trackTop + 25, 7.5, sans, MUTED);
  text(`${maxPct}%`, W - M, trackTop + 25, 7.5, sans, MUTED, { align: "right" });
  const mx = M + Math.min(0.97, Math.max(0.03, r.fpl_pct / maxPct)) * CW;
  page.drawCircle({ x: mx, y: H - trackTop - 4.5, size: 7.5, color: AMBER, borderColor: INK, borderWidth: 2.4 });
  const label = `You · ${r.fpl_pct}%`;
  const lw = bold.widthOfTextAtSize(label, 7.5) + 14;
  rr(mx - lw / 2, trackTop - 25, lw, 14, 7, { color: INK });
  text(label, mx, trackTop - 15, 7.5, bold, CREAM, { align: "center" });

  /* Section heading */
  const heading = (title: string, top: number) => {
    text(title, M, top + 12, 13, display, INK);
    rect(M, top + 18, 24, 2.5, { color: AMBER });
    return top + 32;
  };
  /* A row of filled-in form fields: small caps label, value on a hairline. Every field in a row shares one baseline. */
  type Cell = { label: string; value: string; w: number };
  const row = (cells: Cell[], top: number, maxLines = 2) => {
    const gap = (CW - cells.reduce((n, cell) => n + cell.w, 0)) / (cells.length - 1 || 1);
    const wrapped = cells.map((cell) => wrap(encodable(cell.value || " "), sans, 10.5, cell.w));
    const n = Math.min(maxLines, Math.max(...wrapped.map((l) => l.length)));
    let x = M;
    cells.forEach((cell, i) => {
      text(upper(cell.label), x, top + 7, 6.6, bold, MUTED);
      wrapped[i].slice(0, n).forEach((ln, k) => text(ln, x, top + 22 + k * 12.5, 10.5, sans, INK));
      rect(x, top + 22 + (n - 1) * 12.5 + 6, cell.w, 0.7, { color: INK, opacity: 0.32 });
      x += cell.w + gap;
    });
    return top + 22 + (n - 1) * 12.5 + 6 + 12;
  };

  /* ── Applicant & household ── */
  let y = heading("Applicant and household", 328);
  y = row([{ label: "Full name", value: a.full_name, w: 244 }, { label: "Date of birth", value: a.date_of_birth, w: 104 }, { label: "Phone", value: a.phone, w: 124 }], y, 2);
  y = row([{ label: "Mailing address", value: a.mailing_address.replace(/\r?\n/g, ", "), w: CW }], y, 2);
  y = row([
    { label: "Household size", value: `${r.household_size} ${r.household_size === 1 ? "person" : "people"}`, w: 86 },
    { label: "Annual income", value: usd(r.annual_income), w: 100 },
    { label: "Insurance", value: INSURANCE_LABEL[r.insurance_status], w: 190 },
    { label: "County", value: `${r.county}, ${r.state}`, w: 98 },
  ], y, 2);

  /* ── What the policy says ── */
  y = heading("What the policy says", y + 6);
  const tierLine = `Matched tier: ${tierDescription(r)}`;
  const tierLines = wrap(tierLine, bold, 9.5, CW - 44).slice(0, 4);
  const polLines = [
    ...wrap(`Income is ${r.fpl_pct}% of the Federal Poverty Level. The poverty line for a household of ${r.household_size} is ${usd(r.fpl_base)}.`, sans, 9.5, CW - 44).slice(0, 3),
  ];
  const polH = 24 + (polLines.length + tierLines.length) * 13;
  rr(M, y, CW, polH, 12, { color: AMBER });
  rr(M + 5, y, CW - 5, polH, 12, { color: WHITE });
  polLines.forEach((ln, i) => text(ln, M + 24, y + 22 + i * 13, 9.5, sans, INK));
  tierLines.forEach((ln, i) => text(ln, M + 24, y + 22 + (polLines.length + i) * 13, 9.5, bold, INK));
  y += polH;

  /* ── Documents ── */
  y = heading("Documents to include", y + 14);
  const docs = r.documents_required.slice(0, 8);
  const two = docs.length > 3;
  const colWd = two ? CW / 2 - 8 : CW;
  let docBottom = y;
  docs.forEach((d, i) => {
    const col = two ? i % 2 : 0;
    const rowIdx = two ? Math.floor(i / 2) : i;
    const x = M + col * (CW / 2 + 8);
    const lines = wrap(encodable(d), sans, 9.5, colWd - 22).slice(0, 2);
    const top = y + rowIdx * 30;
    rr(x, top, 12, 12, 3.5, { color: WHITE, border: INK, bw: 1.2 });
    lines.forEach((ln, k) => text(ln, x + 21, top + 10 + k * 11.5, 9.5, sans, INK));
    docBottom = Math.max(docBottom, top + 30);
  });
  y = docBottom;

  /* ── Where to send ── */
  y += 2;
  const sendText = r.mailing_address ?? "See the hospital's financial assistance policy for the mailing address.";
  const sendLines = wrap(encodable(sendText), sans, 10, CW - 110).slice(0, 3);
  const sendH = Math.max(38, 22 + sendLines.length * 13);
  rr(M, y, CW, sendH, 14, { color: AMBER_SOFT });
  text(upper("Send to"), M + 20, y + 23, 7.5, bold, INK);
  sendLines.forEach((ln, i) => text(ln, M + 92, y + 23 + i * 13, 10, sans, INK));

  /* ── Footer (anchored to the bottom of the page) ── */
  const fTop = 728;
  rect(M, fTop, CW, 0.7, { color: INK, opacity: 0.2 });
  const when = r.policy_date && r.policy_date !== "unknown" ? ` (${r.policy_date})` : "";
  text(`Figures from ${r.hospital_name}'s financial assistance policy${when}.`, M, fTop + 14, 7.5, sans, MUTED);
  // Shorten long URLs with an ellipsis so they stop before the wordmark.
  let url = encodable(r.source_url).replace(/^https?:\/\//i, "");
  const urlMax = CW - 170;
  while (url.length > 8 && sans.widthOfTextAtSize(url, 7.5) > urlMax) url = url.slice(0, -2);
  if (url !== encodable(r.source_url).replace(/^https?:\/\//i, "")) url = `${url.trimEnd()}...`;
  text(url, M, fTop + 25, 7.5, sans, GREEN);
  text("An estimate, not a guarantee. Final eligibility is determined by the hospital.", M, fTop + 36, 7.5, sans, MUTED);
  const markW = display.widthOfTextAtSize(APP_NAME, 14);
  text(APP_NAME, W - M, fTop + 30, 14, display, INK, { align: "right" });
  page.drawCircle({ x: W - M - markW - 9, y: H - fTop - 26, size: 3.2, color: AMBER });

  return doc.save();
}
