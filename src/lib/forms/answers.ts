import { ValidationError } from "../engine";
import type { EligibilityInput } from "../types";
import { normalizeValue } from "./normalize";
import type { Answers, FormDef } from "./types";

export interface CleanAnswers {
  /** key -> printed text ("" means left blank). yes/no -> "yes" | "no". */
  values: Record<string, string>;
  /** key -> chosen option values for multichoice */
  multi: Record<string, string[]>;
  /** key -> rows of column -> printed text */
  lists: Record<string, Record<string, string>[]>;
}

const isObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === "object" && !Array.isArray(x);

/**
 * Check the submitted answers against the form definition. Collects every problem so the caller can fix
 * them in one pass. Unknown keys are rejected so a typo never silently drops data.
 */
export function cleanAnswers(form: FormDef, submitted: unknown, opts: { draft?: boolean; input?: EligibilityInput | null } = {}): CleanAnswers {
  if (!isObj(submitted)) throw new ValidationError("answers must be an object");
  const merged: Answers = { ...(opts.input && form.prefill ? form.prefill(opts.input) : {}), ...submitted };
  const problems: string[] = [];
  const known = new Set([...form.fields.map((f) => f.key), ...form.lists.map((l) => l.key)]);
  for (const k of Object.keys(submitted)) if (!known.has(k)) problems.push(`Unknown answer: ${k}`);

  const out: CleanAnswers = { values: {}, multi: {}, lists: {} };
  const attempt = (fn: () => void) => { try { fn(); } catch (e) { if (e instanceof ValidationError) problems.push(e.message); else throw e; } };

  for (const f of form.fields) {
    const raw = merged[f.key];
    if (raw === undefined || raw === null || raw === "" || (Array.isArray(raw) && raw.length === 0)) {
      if (f.required && !opts.draft) problems.push(`${f.label}: required`);
      continue;
    }
    attempt(() => {
      if (f.type === "multichoice") {
        if (!Array.isArray(raw)) throw new ValidationError(`${f.label}: expected a list`);
        out.multi[f.key] = Array.from(new Set(raw.map((v) => normalizeValue(f.label, "choice", v, { options: f.options }))));
      } else {
        out.values[f.key] = normalizeValue(f.label, f.type, raw, { max: f.max, options: f.options });
      }
    });
  }

  for (const l of form.lists) {
    const raw = merged[l.key];
    if (raw === undefined || raw === null) continue;
    if (!Array.isArray(raw)) { problems.push(`${l.label}: expected a list of rows`); continue; }
    if (raw.length > l.max) { problems.push(`${l.label}: the form has room for ${l.max} rows`); continue; }
    out.lists[l.key] = raw.map((row, i) => {
      const clean: Record<string, string> = {};
      if (!isObj(row)) { problems.push(`${l.label} row ${i + 1}: expected an object`); return clean; }
      const cols = new Set(l.columns.map((c) => c.key));
      for (const k of Object.keys(row)) if (!cols.has(k)) problems.push(`${l.label} row ${i + 1}: unknown column ${k}`);
      for (const c of l.columns) {
        const v = row[c.key];
        if (v === undefined || v === null || v === "") continue;
        attempt(() => { clean[c.key] = normalizeValue(`${l.label} row ${i + 1}, ${c.label}`, c.type, v); });
      }
      return clean;
    });
  }

  if (problems.length) throw new FormValidationError(problems);
  return out;
}

export class FormValidationError extends ValidationError {
  constructor(public problems: string[]) {
    super(problems.join("; "));
  }
}
