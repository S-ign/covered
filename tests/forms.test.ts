import { describe, it, expect, afterEach } from "vitest";
import { PDFDocument } from "pdf-lib";
import { readFileSync } from "node:fs";
import path from "node:path";
import { FORMS, FORM_IDS } from "@/lib/forms/definitions";
import { listPdfFields } from "@/lib/forms/fill";
import { normalizeValue } from "@/lib/forms/normalize";
import { formsApiEnabled } from "@/lib/forms/flag";
import { GET as listForms } from "@/app/api/forms/route";
import { GET as getSchema, POST as fillPdf } from "@/app/api/forms/[hospital]/route";
import { POST as validate } from "@/app/api/forms/[hospital]/validate/route";

const ctx = (hospital: string) => ({ params: Promise.resolve({ hospital }) });
const post = (url: string, body: unknown) =>
  new Request(`http://localhost${url}`, { method: "POST", headers: { "content-type": "application/json" }, body: typeof body === "string" ? body : JSON.stringify(body) });
const fill = (hospital: string, body: unknown) => fillPdf(post(`/api/forms/${hospital}`, body), ctx(hospital));
const load = async (res: Response) => PDFDocument.load(new Uint8Array(await res.arrayBuffer()));

const maria = { hospital_id: "piedmont", household_size: 3, annual_income: 38000, bill_amount: 9400, insurance_status: "uninsured", county: "Fulton", state: "GA" };
const piedmontAnswers = {
  patient_name: "Lopez, Maria", date_of_birth: "1988-04-12", physical_address: "123 Peachtree St", city: "Atlanta", state: "ga", zip: "30303",
  phone: "(404) 555-0100", ssn: "123456789",
  household_members: [{ name: "Lopez, Maria", date_of_birth: "1988-04-12", age: "38", relation: "Self", annual_income: "38,000" }],
  has_medicaid: false, over_65: "no",
};

afterEach(() => { delete process.env.VERCEL_ENV; delete process.env.ENABLE_FORMS_API; });

describe("every PDF field is accounted for", () => {
  for (const id of FORM_IDS) {
    it(`${id}: all AcroForm fields are mapped or deliberately skipped, and no mapping points at a missing field`, async () => {
      const form = FORMS[id];
      const fields = await listPdfFields(path.join(process.cwd(), "data", "forms", form.file));
      const real = new Map(fields.map((f) => [f.name, f]));
      const used = new Set<string>(Object.keys(form.skip));
      const claim = (name: string, kind?: string) => {
        const f = real.get(name);
        expect(f, `${id}: mapping uses "${name}" which is not in the PDF`).toBeTruthy();
        if (kind) expect(f!.kind, `${id}: "${name}" is a ${f!.kind}, not a ${kind}`).toBe(kind);
        used.add(name);
      };
      for (const f of form.fields) for (const x of f.fill) {
        if (x.kind === "text" || x.kind === "widget") claim(x.pdf, "text");
        else if (x.kind === "radio") { claim(x.pdf, "radio"); expect(real.get(x.pdf)!.options).toEqual(expect.arrayContaining([x.yes, x.no])); }
        else if (x.kind === "checks") { if (x.yes) claim(x.yes, "check"); if (x.no) claim(x.no, "check"); }
        else for (const n of Object.values(x.pdf)) claim(n, "check");
      }
      for (const l of form.lists) for (const col of Object.values(l.pdf)) { expect(col.length).toBe(l.max); col.forEach((n) => claim(n, "text")); }
      for (const name of Object.keys(form.skip)) expect(real.has(name), `${id}: skip lists "${name}" which is not in the PDF`).toBe(true);
      const unaccounted = fields.map((f) => f.name).filter((n) => !used.has(n));
      expect(unaccounted).toEqual([]);
    });
    it(`${id}: answer keys are unique`, () => {
      const keys = [...FORMS[id].fields.map((f) => f.key), ...FORMS[id].lists.map((l) => l.key)];
      expect(new Set(keys).size).toBe(keys.length);
    });
  }
});

describe("normalizeValue", () => {
  it("formats dates, SSNs, phones and money", () => {
    expect(normalizeValue("d", "date", "1988-04-12")).toBe("04/12/1988");
    expect(normalizeValue("d", "date", "4/2/1990")).toBe("04/02/1990");
    expect(normalizeValue("s", "ssn", "123 45 6789")).toBe("123-45-6789");
    expect(normalizeValue("p", "phone", "+1 (404) 555-0100")).toBe("404-555-0100");
    expect(normalizeValue("m", "money", "$1,234.5")).toBe("1,234.50");
    expect(normalizeValue("m", "money", "0")).toBe("0");
  });
  it("rejects bad input with the field name", () => {
    expect(() => normalizeValue("Date of birth", "date", "1988-02-31")).toThrow(/Date of birth/);
    expect(() => normalizeValue("SSN", "ssn", "12345")).toThrow(/9 digits/);
    expect(() => normalizeValue("Phone", "phone", "555-0100")).toThrow(/10-digit/);
    expect(() => normalizeValue("State", "state", "Georgia")).toThrow(/2-letter/);
    expect(() => normalizeValue("Income", "money", "-5")).toThrow();
    expect(() => normalizeValue("Name", "text", "x".repeat(500))).toThrow(/characters or fewer/);
  });
  it("strips accents and replaces unsupported characters instead of crashing the PDF", () => {
    expect(normalizeValue("n", "text", "Nguyễn  Văn")).toBe("Nguyen Van");
    expect(normalizeValue("n", "text", "김민수")).toBe("???");
  });
});

describe("preview-only switch", () => {
  it("is on locally and for previews, off for Vercel production", () => {
    expect(formsApiEnabled({})).toBe(true);
    expect(formsApiEnabled({ VERCEL_ENV: "preview" })).toBe(true);
    expect(formsApiEnabled({ VERCEL_ENV: "development" })).toBe(true);
    expect(formsApiEnabled({ VERCEL_ENV: "production" })).toBe(false);
    expect(formsApiEnabled({ VERCEL_ENV: "production", ENABLE_FORMS_API: "1" })).toBe(true);
  });
  it("every route returns 404 on production", async () => {
    process.env.VERCEL_ENV = "production";
    expect((await listForms()).status).toBe(404);
    expect((await getSchema(new Request("http://localhost/x"), ctx("piedmont"))).status).toBe(404);
    expect((await fill("piedmont", { answers: {}, draft: true })).status).toBe(404);
    expect((await validate(post("/v", { answers: {} }), ctx("piedmont"))).status).toBe(404);
  });
});

describe("GET /api/forms and /api/forms/{hospital}", () => {
  it("lists the three hospitals", async () => {
    const json = await (await listForms()).json();
    expect(json.forms.map((f: { hospital_id: string }) => f.hospital_id)).toEqual(["piedmont", "emory", "grady"]);
  });
  it("describes a form without leaking PDF field names", async () => {
    const res = await getSchema(new Request("http://localhost/x"), ctx("emory"));
    const json = await res.json();
    expect(res.headers.get("x-robots-tag")).toBe("noindex");
    expect(json.fields.find((f: { key: string }) => f.key === "salary_period").options).toHaveLength(3);
    expect(JSON.stringify(json)).not.toMatch(/Check Box|fill_\d+/);
    expect(json.fields.every((f: { fill?: unknown }) => f.fill === undefined)).toBe(true);
  });
  it("404s an unknown hospital", async () => {
    expect((await getSchema(new Request("http://localhost/x"), ctx("nowhere"))).status).toBe(404);
    expect((await getSchema(new Request("http://localhost/x"), ctx("__proto__"))).status).toBe(404);
  });
});

describe("POST /api/forms/{hospital}", () => {
  it("fills Piedmont's own PDF and keeps it fillable", async () => {
    const res = await fill("piedmont", { input: maria, answers: piedmontAnswers });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
    const doc = await load(res);
    expect(doc.getPageCount()).toBe(2);
    const form = doc.getForm();
    expect(form.getTextField("Patient Full Name").getText()).toBe("Lopez, Maria");
    expect(form.getTextField("Date of Birth").getText()).toBe("04/12/1988");
    expect(form.getTextField("State").getText()).toBe("GA");
    expect(form.getTextField("Social Security").getText()).toBe("123-45-6789");
    expect(form.getTextField("Phone Number").getText()).toBe("404-555-0100");
    expect(form.getTextField("fill_48").getText()).toBe("38,000");               // household income pre-filled from the eligibility input
    expect(form.getTextField("Name Last First  MIRow1").getText()).toBe("Lopez, Maria");
    expect(form.getTextField("fill_44").getText()).toBe("38,000");
    expect(form.getRadioGroup("undefined_3").getSelected()).toBe("No_3");       // has_medicaid: false
    expect(form.getRadioGroup("undefined_7").getSelected()).toBe("No_7");       // over_65: "no"
    expect(form.getRadioGroup("undefined").getSelected()).toBe("No");           // uninsured -> no health insurance (pre-filled)
  });
  it("never touches signature, witness, date or office-use fields", async () => {
    const doc = await load(await fill("piedmont", { input: maria, answers: piedmontAnswers }));
    const form = doc.getForm();
    for (const name of Object.keys(FORMS.piedmont.skip)) {
      expect(form.getTextField(name).getText() ?? "", name).toBe("");
    }
  });
  it("flatten removes the editable fields", async () => {
    const doc = await load(await fill("piedmont", { input: maria, answers: piedmontAnswers, flatten: true }));
    expect(doc.getForm().getFields()).toHaveLength(0);
  });
  it("fills Emory choices, checkboxes and money columns", async () => {
    const res = await fill("emory", {
      answers: {
        patient_name: "Maria Lopez", street_address: "123 Peachtree St", city: "Atlanta", state: "GA", zip: "30303", phone: "4045550100",
        married: true, spouse_name: "Luis Lopez", salary_period: "monthly", salary_patient: "3,100", salary_household: 1200,
        documents_attached: ["pay_stubs", "w2"],
      },
    });
    expect(res.status).toBe(200);
    const form = (await load(res)).getForm();
    expect(form.getTextField("fill_1").getText()).toBe("Maria Lopez");
    expect(form.getRadioGroup("Are you married").getSelected()).toBe("Yes");
    expect(form.getCheckBox("Check Box28").isChecked()).toBe(true);
    expect(form.getCheckBox("Hourly Monthly Yearly").isChecked()).toBe(false);
    expect(form.getTextField("fill_18").getText()).toBe("3,100");
    expect(form.getTextField("fill_19").getText()).toBe("1,200");
    expect(form.getCheckBox("Check Box30").isChecked()).toBe(true);
    expect(form.getCheckBox("Check Box33").isChecked()).toBe(true);
    expect(form.getCheckBox("Check Box31").isChecked()).toBe(false);
  });
  it("Grady: the emergency contact's city does not overwrite the patient's city", async () => {
    const res = await fill("grady", {
      input: { ...maria, hospital_id: "grady" },
      answers: {
        patient_name: "Lopez, Maria", address: "123 Peachtree St", city: "Atlanta", county: "Fulton", zip: "30303", home_phone: "4045550100", date_of_birth: "1988-04-12",
        marital_status: "married", treated_at_grady_before: true, emergency_city: "Decatur", emergency_state: "ga", emergency_zip: "30030",
        gross_income_self: 3100, gross_income_self_period: "monthly",
      },
    });
    expect(res.status).toBe(200);
    const doc = await load(res);
    const form = doc.getForm();
    expect(form.getTextField("CITY").getText()).toBe("Atlanta");
    expect(form.getTextField("CITY").acroField.getWidgets()).toHaveLength(1);       // page-2 widget detached
    expect(form.getTextField("STATE").acroField.getWidgets()).toHaveLength(1);
    expect(form.getTextField("ZIP").acroField.getWidgets()).toHaveLength(1);
    expect(form.getTextField("STATE").getText()).toBe("GA");                    // from the eligibility input
    expect(form.getCheckBox("MARRIED").isChecked()).toBe(true);
    expect(form.getCheckBox("YES_TREATED_GRADY").isChecked()).toBe(true);
    expect(form.getCheckBox("MONTHLY_SELF_GROSS").isChecked()).toBe(true);
    expect(form.getCheckBox("WEEKLY_SELF GROSS").isChecked()).toBe(false);
  });
  it("draft mode allows missing required fields; the default does not", async () => {
    const strict = await fill("piedmont", { answers: { facility: "Piedmont Atlanta" } });
    expect(strict.status).toBe(400);
    expect((await strict.json()).problems).toContain("Patient full name: required");
    expect((await fill("piedmont", { answers: { facility: "Piedmont Atlanta" }, draft: true })).status).toBe(200);
  });
  it("reports every bad answer in one response", async () => {
    const res = await fill("piedmont", { answers: { ...piedmontAnswers, ssn: "12", phone: "1", zip: "abc", nope: 1 } });
    expect(res.status).toBe(400);
    const { problems } = await res.json();
    expect(problems).toEqual(expect.arrayContaining([expect.stringMatching(/Social Security/), expect.stringMatching(/Phone/), expect.stringMatching(/ZIP/), "Unknown answer: nope"]));
  });
  it("rejects bad requests", async () => {
    expect((await fillPdf(post("/x", "not json"), ctx("piedmont"))).status).toBe(400);
    expect((await fillPdf(post("/x", "[]"), ctx("piedmont"))).status).toBe(400);
    expect((await fill("nowhere", { answers: {} })).status).toBe(404);
    expect((await fill("piedmont", { input: { ...maria, hospital_id: "emory" }, answers: {}, draft: true })).status).toBe(400);
    expect((await fill("piedmont", { input: { ...maria, household_size: 0 }, answers: {}, draft: true })).status).toBe(400);
    expect((await fill("piedmont", { answers: { household_members: Array.from({ length: 5 }, () => ({})) }, draft: true })).status).toBe(400);
    expect((await fill("piedmont", { answers: { patient_name: ["a"] }, draft: true })).status).toBe(400);
  });
  it("answers the applicant sends override what was pre-filled", async () => {
    const doc = await load(await fill("piedmont", { input: maria, answers: { state: "TN", has_health_insurance: true }, draft: true }));
    expect(doc.getForm().getTextField("State").getText()).toBe("TN");
    expect(doc.getForm().getRadioGroup("undefined").getSelected()).toBe("Yes");
  });
  it("does not modify the template on disk", async () => {
    const before = readFileSync(path.join(process.cwd(), "data/forms/piedmont.pdf")).length;
    await fill("piedmont", { answers: piedmontAnswers, draft: true });
    expect(readFileSync(path.join(process.cwd(), "data/forms/piedmont.pdf")).length).toBe(before);
    const blank = await PDFDocument.load(readFileSync(path.join(process.cwd(), "data/forms/piedmont.pdf")));
    expect(blank.getForm().getTextField("Patient Full Name").getText()).toBeFalsy();
  });
});

describe("POST /api/forms/{hospital}/validate", () => {
  it("lists what is still missing and whether a draft can be downloaded", async () => {
    const res = await validate(post("/v", { answers: { date: "2026-10-14" } }), ctx("grady"));
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.missing_required).toEqual(expect.arrayContaining(["Name (last, first, middle)", "County"]));
    expect(json.can_download_draft).toBe(true);
  });
  it("says ok when everything required is present", async () => {
    const res = await validate(post("/v", { input: maria, answers: piedmontAnswers }), ctx("piedmont"));
    expect(await res.json()).toEqual({ ok: true, missing_required: [], problems: [] });
  });
  it("separates malformed values from missing ones", async () => {
    const json = await (await validate(post("/v", { answers: { ssn: "1" } }), ctx("piedmont"))).json();
    expect(json.problems.some((p: string) => /Social Security/.test(p))).toBe(true);
    expect(json.can_download_draft).toBe(false);
  });
});
