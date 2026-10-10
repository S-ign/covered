import { describe, it, expect } from "vitest";
import { validateHospitals, validateFpl } from "@/lib/validate";
import hospitalsJson from "../data/hospitals.json";
import fplJson from "../data/fpl-2026.json";
import type { HospitalPolicy, FplTable } from "@/lib/types";

const hospitals = hospitalsJson.hospitals as unknown as HospitalPolicy[];
const fpl = fplJson as FplTable;
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

describe("validateHospitals", () => {
  it("accepts the shipped data", () => {
    expect(validateHospitals(hospitals)).toEqual([]);
  });
  it("rejects duplicate ids", () => {
    const bad = clone(hospitals);
    bad[1].id = bad[0].id;
    expect(validateHospitals(bad).join(" ")).toMatch(/duplicate id/);
  });
  it("rejects tiers out of order", () => {
    const bad = clone(hospitals);
    const emory = bad.find((h) => h.id === "emory")!;
    emory.tiers = [emory.tiers[2], emory.tiers[0], emory.tiers[1]];
    expect(validateHospitals(bad).join(" ")).toMatch(/sorted/);
  });
  it("rejects a discount outside 0..100", () => {
    const bad = clone(hospitals);
    bad[0].tiers[0].discount_pct = 150;
    expect(validateHospitals(bad).join(" ")).toMatch(/discount_pct/);
  });
  it("rejects a non-https url", () => {
    const bad = clone(hospitals);
    bad[0].policy_url = "http://example.com";
    expect(validateHospitals(bad).join(" ")).toMatch(/https/);
  });
});

describe("validateFpl", () => {
  it("accepts the shipped table", () => {
    expect(validateFpl(fpl)).toEqual([]);
  });
  it("rejects a missing size", () => {
    const bad = clone(fpl);
    delete bad.by_size["5"];
    expect(validateFpl(bad).join(" ")).toMatch(/by_size\.5/);
  });
  it("rejects non-increasing sizes", () => {
    const bad = clone(fpl);
    bad.by_size["4"] = bad.by_size["3"];
    expect(validateFpl(bad).join(" ")).toMatch(/increas/);
  });
});
