import type { EligibilityInput } from "../types";

export type FieldType =
  | "text" | "multiline" | "date" | "ssn" | "phone" | "zip" | "state"
  | "money" | "integer" | "yesno" | "choice" | "multichoice";

export interface Option { value: string; label: string }

/** How one API answer is written into the hospital's fillable PDF. Names are real AcroForm field names. */
export type Fill =
  | { kind: "text"; pdf: string }
  | { kind: "radio"; pdf: string; yes: string; no: string }          // yes/no answered with a radio group
  | { kind: "checks"; yes?: string; no?: string }                    // yes/no answered with check boxes
  | { kind: "options"; pdf: Record<string, string> }                 // choice(s): one check box per option
  /** One widget of a field that the PDF shares between two places (Grady: CITY/STATE/ZIP on pages 1 and 2). */
  | { kind: "widget"; pdf: string; page: number };

export interface FieldSpec {
  key: string;
  label: string;
  type: FieldType;
  section: string;
  required?: boolean;
  help?: string;
  max?: number;
  options?: Option[];
  fill: Fill[];
}

export interface ListColumn { key: string; label: string; type: FieldType }

/** A repeating table (for example household members). `pdf[column][rowIndex]` is the PDF field name. */
export interface ListSpec {
  key: string;
  label: string;
  section: string;
  max: number;
  columns: ListColumn[];
  pdf: Record<string, string[]>;
}

export interface FormDef {
  id: string;
  file: string;
  title: string;
  sections: { id: string; title: string }[];
  fields: FieldSpec[];
  lists: ListSpec[];
  /** PDF fields that are deliberately never filled (signatures, dates beside signatures, office use, unlabeled boxes). */
  skip: Record<string, string>;
  /** Answers the app already knows from the eligibility check. Anything the applicant sends overrides these. */
  prefill?: (input: EligibilityInput) => Answers;
}

export type Answers = Record<string, unknown>;
