import { ValidationError } from "./engine";
import type { Applicant, EligibilityInput, InsuranceStatus } from "./types";

type Obj = Record<string, unknown>;
const obj = (x: unknown): Obj => (x && typeof x === "object" ? (x as Obj) : {});
const NUMERIC = /^\s*-?\d+(\.\d+)?\s*$/;
const num = (x: unknown): number =>
  typeof x === "number" ? x : typeof x === "string" && NUMERIC.test(x) ? Number(x) : NaN;
const str = (x: unknown): string => (x === null || x === undefined ? "" : String(x));

export function parseInput(body: unknown): EligibilityInput {
  const b = obj(body);
  return {
    hospital_id: str(b.hospital_id),
    household_size: num(b.household_size),
    annual_income: num(b.annual_income),
    bill_amount: num(b.bill_amount),
    insurance_status: str(b.insurance_status) as InsuranceStatus,
    county: str(b.county),
    state: str(b.state) || "GA",
  };
}

export function parseApplicant(body: unknown): Applicant {
  const b = obj(body);
  const a: Applicant = {
    full_name: str(b.full_name).trim(),
    mailing_address: str(b.mailing_address).trim(),
    phone: str(b.phone).trim(),
    date_of_birth: str(b.date_of_birth).trim(),
  };
  for (const [k, v] of Object.entries(a)) {
    if (v === "") throw new ValidationError(`applicant.${k} is required`);
  }
  return a;
}
