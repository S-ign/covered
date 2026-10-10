export type InsuranceStatus = "uninsured" | "underinsured";

export type Residency =
  | { type: "none" }
  | { type: "state"; values: string[] }
  | { type: "county"; values: string[] };

export interface Tier {
  max_fpl_pct: number | null;
  discount_pct: number | null;
  applies_to: InsuranceStatus | "any";
  note?: string;
}

export interface PolicyConflict {
  claim: string;
  source_url: string;
  note: string;
}

export interface HospitalPolicy {
  id: string;
  name: string;
  policy_url: string;
  policy_date: string;
  application_url: string;
  mailing_address: string | null;
  residency: Residency;
  tiers: Tier[];
  documents_required: string[];
  policy_conflicts: PolicyConflict[];
  verified: boolean;
  notes?: string;
}

export interface FplTable {
  year: number;
  source_url: string;
  verified: boolean;
  note?: string;
  by_size: Record<string, number>;
  additional_person: number;
}

export interface EligibilityInput {
  hospital_id: string;
  household_size: number;
  annual_income: number;
  bill_amount: number;
  insurance_status: InsuranceStatus;
  county: string;
  state: string;
}

export type EligibilityStatus =
  | "free"
  | "discounted"
  | "eligible_sliding_scale"
  | "no_match";

export interface EligibilityResult {
  hospital: string;
  hospital_name: string;
  household_size: number;
  annual_income: number;
  insurance_status: InsuranceStatus;
  county: string;
  state: string;
  fpl_base: number;
  fpl_pct: number;
  tier_matched: Tier | null;
  status: EligibilityStatus;
  bill_before: number;
  bill_after: number | null;
  residency_ok: boolean;
  residency: Residency;
  documents_required: string[];
  application_url: string;
  mailing_address: string | null;
  source_url: string;
  policy_date: string;
  policy_conflicts: PolicyConflict[];
  verified: boolean;
}

export interface Applicant {
  full_name: string;
  mailing_address: string;
  phone: string;
  date_of_birth: string;
}

export interface ApplicationRequest {
  input: EligibilityInput;
  applicant: Applicant;
}
