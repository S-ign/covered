import { ValidationError } from "../engine";
import type { FieldType, Option } from "./types";

/** The standard PDF fonts only draw Latin-1. Strip accents, replace anything else so a field never throws or shows a blank box. */
const SAFE = /[\u0020-\u007E\u00A0-\u00FF\u2010-\u2015\u2018-\u201F\u2022\u2026\u20AC\u2122]/;
export function encodable(s: string): string {
  // NFKD splits accents off Latin letters; NFC then glues scripts like Hangul back into whole characters so each one becomes a single "?".
  return Array.from(s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").normalize("NFC"))
    .map((ch) => (SAFE.test(ch) ? ch : "?"))
    .join("");
}

const DEFAULT_MAX: Partial<Record<FieldType, number>> = { text: 120, multiline: 220 };

/** Turn one submitted answer into the exact text that is printed in the PDF, or throw a ValidationError naming the field. */
export function normalizeValue(label: string, type: FieldType, raw: unknown, opts: { max?: number; options?: Option[] } = {}): string {
  const bad = (why: string) => new ValidationError(`${label}: ${why}`);
  const text = typeof raw === "string" ? raw.trim() : typeof raw === "number" || typeof raw === "boolean" ? String(raw) : null;
  if (text === null) throw bad("expected a text or number value");
  if (text === "") return "";

  switch (type) {
    case "text":
    case "multiline": {
      const max = opts.max ?? DEFAULT_MAX[type] ?? 120;
      const clean = encodable(type === "multiline" ? text.replace(/\r/g, "") : text.replace(/\s+/g, " ")).replace(/[\u0000-\u0009\u000B-\u001F]/g, "");
      if (clean.length > max) throw bad(`must be ${max} characters or fewer`);
      return clean;
    }
    case "date": {
      let m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
      let y: number, mo: number, d: number;
      if (m) [y, mo, d] = [+m[1], +m[2], +m[3]];
      else if ((m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text))) [mo, d, y] = [+m[1], +m[2], +m[3]];
      else throw bad("use a date like 1988-04-12 or 04/12/1988");
      const dt = new Date(Date.UTC(y, mo - 1, d));
      if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d || y < 1900) throw bad("is not a real calendar date");
      return `${String(mo).padStart(2, "0")}/${String(d).padStart(2, "0")}/${y}`;
    }
    case "ssn": {
      const digits = text.replace(/[\s-]/g, "");
      if (!/^\d{9}$/.test(digits)) throw bad("must be 9 digits");
      return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
    }
    case "phone": {
      const digits = text.replace(/[\s().-]/g, "").replace(/^\+?1(?=\d{10}$)/, "");
      if (!/^\d{10}$/.test(digits)) throw bad("must be a 10-digit US phone number");
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    case "zip": {
      if (!/^\d{5}(-\d{4})?$/.test(text)) throw bad("must be a 5-digit ZIP code (or ZIP+4)");
      return text;
    }
    case "state": {
      if (!/^[A-Za-z]{2}$/.test(text)) throw bad("use the 2-letter state code, for example GA");
      return text.toUpperCase();
    }
    case "money": {
      const cleaned = text.replace(/[$,\s]/g, "");
      if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) throw bad("must be a dollar amount of 0 or more");
      const n = Number(cleaned);
      if (n > 99_999_999) throw bad("is too large");
      return n.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: Number.isInteger(n) ? 0 : 2 });
    }
    case "integer": {
      if (!/^\d{1,3}$/.test(text)) throw bad("must be a whole number from 0 to 999");
      return String(Number(text));
    }
    case "yesno": {
      const v = text.toLowerCase();
      if (["yes", "true", "y"].includes(v)) return "yes";
      if (["no", "false", "n"].includes(v)) return "no";
      throw bad('must be true/false or "yes"/"no"');
    }
    case "choice": {
      const hit = opts.options?.find((o) => o.value === text);
      if (!hit) throw bad(`must be one of: ${(opts.options ?? []).map((o) => o.value).join(", ")}`);
      return hit.value;
    }
    default:
      throw bad("unsupported field type");
  }
}
