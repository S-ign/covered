import type {
  EligibilityInput, EligibilityResult, EligibilityStatus, FplTable,
  HospitalPolicy, InsuranceStatus, Residency, Tier,
} from "./types";

export class ValidationError extends Error {}

const INSURANCE: ReadonlySet<string> = new Set(["uninsured", "underinsured"]);

export function validateInput(input: EligibilityInput): void {
  if (!Number.isInteger(input.household_size) || input.household_size < 1 || input.household_size > 20) {
    throw new ValidationError("household_size must be a whole number from 1 to 20");
  }
  if (!Number.isFinite(input.annual_income) || input.annual_income < 0) {
    throw new ValidationError("annual_income must be a number of 0 or more");
  }
  if (!Number.isFinite(input.bill_amount) || input.bill_amount <= 0) {
    throw new ValidationError("bill_amount must be a number greater than 0");
  }
  if (!INSURANCE.has(input.insurance_status)) {
    throw new ValidationError('insurance_status must be "uninsured" or "underinsured"');
  }
  if (typeof input.county !== "string" || input.county.trim() === "") {
    throw new ValidationError("county is required");
  }
}

export function fplBase(householdSize: number, table: FplTable): number {
  if (householdSize <= 8) return table.by_size[String(householdSize)];
  return table.by_size["8"] + (householdSize - 8) * table.additional_person;
}

export function matchTier(tiers: Tier[], fplPct: number, status: InsuranceStatus): Tier | null {
  for (const t of tiers) {
    const statusOk = t.applies_to === "any" || t.applies_to === status;
    const pctOk = t.max_fpl_pct === null || fplPct <= t.max_fpl_pct;
    if (statusOk && pctOk) return t;
  }
  return null;
}

const norm = (s: string) => s.trim().toLowerCase();

export function residencyOk(residency: Residency, input: EligibilityInput): boolean {
  switch (residency.type) {
    case "none":
      return true;
    case "state":
      return residency.values.map(norm).includes(norm(input.state));
    case "county":
      return residency.values.map(norm).includes(norm(input.county));
  }
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function computeEligibility(
  input: EligibilityInput,
  hospital: HospitalPolicy,
  table: FplTable,
): EligibilityResult {
  validateInput(input);
  const fpl_base = fplBase(input.household_size, table);
  const fpl_pct = Math.round((input.annual_income / fpl_base) * 100);
  const tier = matchTier(hospital.tiers, fpl_pct, input.insurance_status);

  let status: EligibilityStatus;
  let bill_after: number | null;
  if (!tier) {
    status = "no_match";
    bill_after = null;
  } else if (tier.discount_pct === null) {
    status = "eligible_sliding_scale";
    bill_after = null;
  } else if (tier.discount_pct === 100) {
    status = "free";
    bill_after = 0;
  } else {
    status = "discounted";
    bill_after = round2(input.bill_amount * (1 - tier.discount_pct / 100));
  }

  return {
    hospital: hospital.id,
    hospital_name: hospital.name,
    household_size: input.household_size,
    annual_income: input.annual_income,
    insurance_status: input.insurance_status,
    county: input.county,
    state: input.state,
    fpl_base,
    fpl_pct,
    tier_matched: tier,
    status,
    bill_before: input.bill_amount,
    bill_after,
    residency_ok: residencyOk(hospital.residency, input),
    residency: hospital.residency,
    documents_required: hospital.documents_required,
    application_url: hospital.application_url,
    mailing_address: hospital.mailing_address,
    source_url: hospital.policy_url,
    policy_date: hospital.policy_date,
    policy_conflicts: hospital.policy_conflicts,
    verified: hospital.verified,
  };
}
