import { describe, it, expect } from "vitest";
import { GET as getHospitals } from "@/app/api/hospitals/route";
import { POST as postEligibility } from "@/app/api/eligibility/route";

const post = (body: unknown) =>
  postEligibility(new Request("http://localhost/api/eligibility", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  }));

const maria = {
  hospital_id: "piedmont", household_size: 3, annual_income: 38000, bill_amount: 9400,
  insurance_status: "uninsured", county: "Fulton", state: "GA",
};

describe("GET /api/hospitals", () => {
  it("returns three hospitals with ids", async () => {
    const res = getHospitals();
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.hospitals.map((h: { id: string }) => h.id)).toEqual(["piedmont", "emory", "grady"]);
  });
});

describe("POST /api/eligibility", () => {
  it("computes maria", async () => {
    const res = await post(maria);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.fpl_pct).toBe(143);
    expect(json.bill_after).toBe(0);
  });
  it("coerces string numbers from a query-string client", async () => {
    const res = await post({ ...maria, household_size: "3", annual_income: "38000", bill_amount: "9400" });
    expect(res.status).toBe(200);
    expect((await res.json()).fpl_pct).toBe(143);
  });
  it("404s an unknown hospital", async () => {
    const res = await post({ ...maria, hospital_id: "nowhere" });
    expect(res.status).toBe(404);
    expect((await res.json()).error).toMatch(/nowhere/);
  });
  it("400s garbage income with a readable message", async () => {
    const res = await post({ ...maria, annual_income: "abc" });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/annual_income/);
  });
  it("400s a missing field", async () => {
    const { bill_amount: _omit, ...rest } = maria;
    const res = await post(rest);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/bill_amount/);
  });
  it("400s a non-JSON body", async () => {
    const res = await post("not json");
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/JSON/);
  });
});

describe("POST /api/eligibility coercion", () => {
  it("400s whitespace income instead of reading it as 0", async () => {
    const res = await post({ ...maria, annual_income: " " });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/annual_income/);
  });
  it("400s a boolean household_size instead of reading it as 1", async () => {
    const res = await post({ ...maria, household_size: true });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/household_size/);
  });
});
