import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import { renderApplicationPdf } from "@/lib/pdf/generated";
import { POST as postApplication } from "@/app/api/application/route";
import results from "@/lib/fixtures/results.json";
import type { EligibilityResult } from "@/lib/types";

const maria = results["maria-piedmont"] as unknown as EligibilityResult;
const applicant = {
  full_name: "Maria Lopez",
  mailing_address: "123 Peachtree St\nAtlanta, GA 30303",
  phone: "404-555-0100",
  date_of_birth: "1988-04-12",
};
const input = {
  hospital_id: "piedmont", household_size: 3, annual_income: 38000, bill_amount: 9400,
  insurance_status: "uninsured", county: "Fulton", state: "GA",
};
const post = (body: unknown) =>
  postApplication(new Request("http://localhost/api/application", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }));

describe("renderApplicationPdf", () => {
  it("produces a one-page PDF", async () => {
    const bytes = await renderApplicationPdf(maria, applicant);
    expect(Buffer.from(bytes.slice(0, 4)).toString()).toBe("%PDF");
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(1);
  });
  it("handles a sliding-scale result without a dollar figure", async () => {
    const darnell = results["darnell-grady"] as unknown as EligibilityResult;
    const bytes = await renderApplicationPdf(darnell, applicant);
    expect((await PDFDocument.load(bytes)).getPageCount()).toBe(1);
  });
});

describe("POST /api/application", () => {
  it("returns a PDF attachment", async () => {
    const res = await post({ input, applicant });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
    expect(res.headers.get("content-disposition")).toContain("covered-piedmont-application.pdf");
    const buf = Buffer.from(await res.arrayBuffer());
    expect(buf.subarray(0, 4).toString()).toBe("%PDF");
  });
  it("400s an empty applicant field before rendering", async () => {
    const res = await post({ input, applicant: { ...applicant, phone: "  " } });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/applicant\.phone/);
  });
  it("400s bad eligibility input", async () => {
    const res = await post({ input: { ...input, household_size: 0 }, applicant });
    expect(res.status).toBe(400);
  });
  it("404s an unknown hospital", async () => {
    const res = await post({ input: { ...input, hospital_id: "nowhere" }, applicant });
    expect(res.status).toBe(404);
  });
});

describe("POST /api/application robustness", () => {
  it("renders a PDF for a name outside the Latin-1 font", async () => {
    const res = await post({ input, applicant: { ...applicant, full_name: "Nguyễn Văn An 김민수" } });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
  });
  it("400s a JSON null body", async () => {
    const res = await post(null);
    expect(res.status).toBe(400);
  });
});
