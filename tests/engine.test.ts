import { describe, it, expect } from "vitest";
import { computeEligibility, ValidationError } from "@/lib/engine";
import hospitalsJson from "../data/hospitals.json";
import fplJson from "../data/fpl-2026.json";
import type { EligibilityInput, FplTable, HospitalPolicy } from "@/lib/types";

const hospitals = hospitalsJson.hospitals as unknown as HospitalPolicy[];
const fpl = fplJson as FplTable;
const h = (id: string) => hospitals.find((x) => x.id === id)!;

const maria: EligibilityInput = {
  hospital_id: "piedmont", household_size: 3, annual_income: 38000, bill_amount: 9400,
  insurance_status: "uninsured", county: "Fulton", state: "GA",
};
const johnsons: EligibilityInput = { ...maria, hospital_id: "emory", annual_income: 65000 };
const darnell: EligibilityInput = {
  hospital_id: "grady", household_size: 2, annual_income: 50000, bill_amount: 4200,
  insurance_status: "uninsured", county: "DeKalb", state: "GA",
};

describe("personas", () => {
  it("maria at piedmont: 143%, free, $0", () => {
    const r = computeEligibility(maria, h("piedmont"), fpl);
    expect(r.fpl_base).toBe(26650);
    expect(r.fpl_pct).toBe(143);
    expect(r.status).toBe("free");
    expect(r.bill_before).toBe(9400);
    expect(r.bill_after).toBe(0);
    expect(r.tier_matched).toEqual({ max_fpl_pct: 300, discount_pct: 100, applies_to: "uninsured" });
    expect(r.residency_ok).toBe(true);
    expect(r.source_url).toBe(h("piedmont").policy_url);
    expect(r.county).toBe("Fulton");
  });
  it("maria at emory: 143%, free, conflict note present", () => {
    const r = computeEligibility({ ...maria, hospital_id: "emory" }, h("emory"), fpl);
    expect(r.fpl_pct).toBe(143);
    expect(r.status).toBe("free");
    expect(r.bill_after).toBe(0);
    expect(r.policy_conflicts).toHaveLength(1);
  });
  it("johnsons at emory: 244%, 35% discount, $6,110", () => {
    const r = computeEligibility(johnsons, h("emory"), fpl);
    expect(r.fpl_pct).toBe(244);
    expect(r.status).toBe("discounted");
    expect(r.tier_matched?.discount_pct).toBe(35);
    expect(r.bill_after).toBe(6110);
  });
  it("johnsons at piedmont: 244%, free", () => {
    const r = computeEligibility({ ...johnsons, hospital_id: "piedmont" }, h("piedmont"), fpl);
    expect(r.fpl_pct).toBe(244);
    expect(r.status).toBe("free");
    expect(r.bill_after).toBe(0);
  });
  it("darnell at grady: 236%, sliding scale, bill_after null", () => {
    const r = computeEligibility(darnell, h("grady"), fpl);
    expect(r.fpl_base).toBe(21150);
    expect(r.fpl_pct).toBe(236);
    expect(r.status).toBe("eligible_sliding_scale");
    expect(r.bill_after).toBeNull();
    expect(r.residency_ok).toBe(true);
  });
  it("darnell in cobb: residency warning, same status", () => {
    const r = computeEligibility({ ...darnell, county: "Cobb" }, h("grady"), fpl);
    expect(r.status).toBe("eligible_sliding_scale");
    expect(r.residency_ok).toBe(false);
  });
});

describe("rules", () => {
  it("household of 10 uses the additional-person increment", () => {
    const r = computeEligibility({ ...maria, household_size: 10, annual_income: 65150 }, h("piedmont"), fpl);
    expect(r.fpl_base).toBe(54150 + 2 * 5500);
    expect(r.fpl_pct).toBe(100);
  });
  it("emory underinsured at 150% has no matching tier", () => {
    const r = computeEligibility({ ...maria, hospital_id: "emory", insurance_status: "underinsured", annual_income: 40000 }, h("emory"), fpl);
    expect(r.fpl_pct).toBe(150);
    expect(r.status).toBe("no_match");
    expect(r.tier_matched).toBeNull();
    expect(r.bill_after).toBeNull();
  });
  it("county match ignores case and whitespace", () => {
    const r = computeEligibility({ ...darnell, county: " fulton " }, h("grady"), fpl);
    expect(r.residency_ok).toBe(true);
  });
  it("bill with cents rounds to cents at 35%", () => {
    const r = computeEligibility({ ...johnsons, bill_amount: 9400.5 }, h("emory"), fpl);
    expect(r.bill_after).toBe(6110.33);
  });
});

describe("validation", () => {
  const bad = (patch: Partial<EligibilityInput>, re: RegExp) => {
    expect(() => computeEligibility({ ...maria, ...patch }, h("piedmont"), fpl)).toThrow(ValidationError);
    expect(() => computeEligibility({ ...maria, ...patch }, h("piedmont"), fpl)).toThrow(re);
  };
  it("rejects household_size 0", () => bad({ household_size: 0 }, /household_size/));
  it("rejects household_size 21", () => bad({ household_size: 21 }, /household_size/));
  it("rejects non-integer household_size", () => bad({ household_size: 3.5 }, /household_size/));
  it("rejects negative income", () => bad({ annual_income: -1 }, /annual_income/));
  it("rejects NaN income", () => bad({ annual_income: NaN }, /annual_income/));
  it("rejects bill_amount 0", () => bad({ bill_amount: 0 }, /bill_amount/));
  it("rejects unknown insurance_status", () => bad({ insurance_status: "medicaid" as never }, /insurance_status/));
  it("rejects empty county", () => bad({ county: "  " }, /county/));
});
