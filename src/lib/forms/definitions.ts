import type { Answers, FieldSpec, FormDef, ListSpec, Option } from "./types";

/**
 * One definition per hospital. Every `pdf` name below is a real AcroForm field name read from the
 * hospital's own fillable PDF (data/forms/<id>.pdf). `npm run pdf:fields data/forms/<id>.pdf` lists them,
 * and tests/forms.test.ts fails if a PDF field is neither mapped here nor deliberately listed in `skip`.
 */

const t = (key: string, label: string, pdf: string, section: string, extra: Partial<FieldSpec> = {}): FieldSpec =>
  ({ key, label, type: "text", section, fill: [{ kind: "text", pdf }], ...extra });
const money = (key: string, label: string, pdf: string, section: string, extra: Partial<FieldSpec> = {}) =>
  t(key, label, pdf, section, { type: "money", ...extra });
const yesNoRadio = (key: string, label: string, pdf: string, section: string): FieldSpec => {
  const suffix = pdf.slice("undefined".length); // "", "_2", "_3" ...
  return { key, label, type: "yesno", section, fill: [{ kind: "radio", pdf, yes: `Yes${suffix}`, no: `No${suffix}` }] };
};
const yesNoChecks = (key: string, label: string, yes: string, no: string, section: string): FieldSpec =>
  ({ key, label, type: "yesno", section, fill: [{ kind: "checks", yes, no }] });
const rows = (prefix: string, n: number, suffix = "") => Array.from({ length: n }, (_, i) => `${prefix}${i + 1}${suffix}`);

const RELATION = "Relationship to the patient";

// ───────────────────────── Piedmont ─────────────────────────
const piedmontList: ListSpec = {
  key: "household_members",
  label: "Household members, including the patient",
  section: "household",
  max: 4,
  columns: [
    { key: "name", label: "Name (last, first, MI)", type: "text" },
    { key: "date_of_birth", label: "Date of birth", type: "date" },
    { key: "age", label: "Age", type: "integer" },
    { key: "relation", label: "Relation", type: "text" },
    { key: "occupation", label: "Occupation", type: "text" },
    { key: "ssn", label: "Social Security number", type: "ssn" },
    { key: "annual_income", label: "Annual income", type: "money" },
  ],
  pdf: {
    name: rows("Name Last First  MIRow", 4),
    date_of_birth: rows("DOBRow", 4),
    age: rows("AgeRow", 4),
    relation: rows("RelationRow", 4),
    occupation: rows("OccupationRow", 4),
    ssn: rows("Security Social Row", 4),
    annual_income: ["fill_44", "fill_45", "fill_46", "fill_47"],
  },
};

const piedmont: FormDef = {
  id: "piedmont",
  file: "piedmont.pdf",
  title: "Piedmont Healthcare Financial Assistance Application",
  sections: [
    { id: "applicant", title: "Applicant information" },
    { id: "household", title: "Household members" },
    { id: "income", title: "Sources of income and expenses" },
    { id: "coverage", title: "Coverage and other questions" },
    { id: "signature", title: "Signature page" },
  ],
  fields: [
    t("date_of_service", "Date of service (past or future)", "Date of Service Past or Future", "applicant", { type: "date" }),
    t("facility", "Facility", "Facility", "applicant"),
    t("patient_name", "Patient full name", "Patient Full Name", "applicant", { required: true }),
    t("ssn", "Social Security number", "Social Security", "applicant", { type: "ssn" }),
    t("date_of_birth", "Date of birth", "Date of Birth", "applicant", { type: "date", required: true }),
    t("physical_address", "Physical address", "Physical Address", "applicant", { required: true }),
    t("city", "City", "City", "applicant", { required: true }),
    t("state", "State", "State", "applicant", { type: "state", required: true }),
    t("zip", "ZIP code", "Zip", "applicant", { type: "zip", required: true }),
    t("mailing_address", "Mailing address", "Mailing Address", "applicant", { help: "Leave blank if it is the same as the physical address." }),
    t("medical_record_number", "Medical record number", "Medical Record Number", "applicant", { help: "On a hospital bill or statement. Optional." }),
    t("phone", "Phone number", "Phone Number", "applicant", { type: "phone", required: true }),
    t("completed_by", "Name of person completing the application", "Name of Person Completing Application", "applicant"),
    t("relationship_to_patient", RELATION, "Relationship to Patient", "applicant"),
    money("household_total_income", "Total household annual income", "fill_48", "household"),
    money("income_wages", "Income (wages)", "fill_50", "income"),
    money("income_social_security", "Social Security", "fill_52", "income"),
    money("income_other", "Other income, alimony, investments, retirement", "fill_53", "income"),
    money("income_total", "Total income", "fill_55", "income"),
    money("rent_amount", "Rent amount", "fill_57", "income"),
    money("mortgage_amount", "Mortgage amount", "fill_59", "income"),
    money("retirement_balance", "401K/IRA balance", "fill_62", "income"),
    money("savings_balance", "Savings account balance", "savings_balance", "income"),
    t("no_income_support", "If no income, how are you supporting yourself?", "If no income how are you supporting yourselfRow1", "income", { type: "multiline", max: 220 }),
    yesNoRadio("has_health_insurance", "Does the patient have health insurance?", "undefined", "coverage"),
    yesNoRadio("injury_third_party", "Is the patient being treated for injuries covered by third-party liability (auto insurance, Workers' Compensation)?", "undefined_2", "coverage"),
    yesNoRadio("has_medicaid", "Does the patient have Medicaid?", "undefined_3", "coverage"),
    yesNoRadio("applied_medicaid", "Has the patient applied for Medicaid?", "undefined_4", "coverage"),
    yesNoRadio("pregnant", "Are you pregnant?", "undefined_5", "coverage"),
    yesNoRadio("social_security_disability", "Are you on Social Security Disability?", "undefined_6", "coverage"),
    yesNoRadio("over_65", "Are you over 65?", "undefined_7", "coverage"),
    yesNoRadio("age_19_or_younger", "Are you 19 or younger?", "undefined_8", "coverage"),
    yesNoRadio("custodial_parent_unemployed", "Are you a custodial parent and unemployed?", "undefined_9", "coverage"),
    yesNoRadio("on_visa", "Are you here on a visa?", "undefined_10", "coverage"),
    t("visa_details", "Visa ID number, country, date to return", "Visa IDCountryDate to return", "coverage"),
    t("applicant_print_name", "Applicant name (printed, beside the signature line)", "Applicant Name PRINT", "signature"),
  ],
  lists: [piedmontList],
  prefill: (i) => ({
    state: i.state,
    household_total_income: i.annual_income,
    has_health_insurance: i.insurance_status === "underinsured",
  }),
  skip: {
    "Medicaid Vendor Verification": "Office use: completed by the hospital's Medicaid vendor.",
    "Describe belowRow1": "Second box under 'Describe below:'. The form does not say what goes there, so it is left for the applicant.",
    "Date": "Signature date: written by the signer.",
    "Time": "Signature time: written by the signer.",
    "Witness Name PRINT": "Witness section: completed by the witness.",
    "Date_2": "Witness date: written by the witness.",
    "Time_2": "Witness time: written by the witness.",
    "Signature38_es_:signer:signature": "Signature: never generated. The applicant signs by hand.",
    "Signature39_es_:signer:signature": "Signature: never generated. The witness signs by hand.",
  },
};

// ───────────────────────── Emory ─────────────────────────
const EMORY_DOCS: Option[] = [
  { value: "pay_stubs", label: "Pay stubs for the last 4 weeks (or employer statement of gross wages)" },
  { value: "tax_return", label: "Most recent tax return" },
  { value: "irs_1040", label: "Most recent IRS Form 1040" },
  { value: "w2", label: "IRS W-2 form (issued during the past year)" },
  { value: "income_award_letter", label: "Income award letter" },
  { value: "unemployment_denial", label: "Unemployment compensation denial letter" },
  { value: "bank_statements", label: "Most recent two months of bank statements for each account" },
  { value: "other_income_attestation", label: "Documentation or attestation of all other income for the most recent two months" },
];
const incomePair = (key: string, label: string, patient: string, other: string): FieldSpec[] => [
  money(`${key}_patient`, `${label}: patient`, patient, "income"),
  money(`${key}_household`, `${label}: spouse / other household member`, other, "income"),
];
const emory: FormDef = {
  id: "emory",
  file: "emory.pdf",
  title: "Emory Healthcare Financial Assistance Application",
  sections: [
    { id: "patient", title: "Patient" },
    { id: "guarantor", title: "Guarantor (if different from the patient)" },
    { id: "household", title: "Household" },
    { id: "income", title: "Family income" },
    { id: "documents", title: "Documents you are attaching" },
    { id: "signature", title: "Signature page" },
  ],
  fields: [
    t("patient_name", "Patient's name", "fill_1", "patient", { required: true }),
    t("patient_ssn", "Patient's Social Security number", "SS", "patient", { type: "ssn" }),
    t("guarantor_name", "Guarantor's name", "undefined", "guarantor"),
    t("guarantor_ssn", "Guarantor's Social Security number", "SS_2", "guarantor", { type: "ssn" }),
    t("street_address", "Street address", "Street Address", "patient", { required: true }),
    t("city", "City", "City", "patient", { required: true }),
    t("state", "State", "State", "patient", { type: "state", required: true }),
    t("zip", "ZIP code", "Zip", "patient", { type: "zip", required: true }),
    t("phone", "Phone", "Phone", "patient", { type: "phone", required: true }),
    t("employer", "Employer", "Employer", "household"),
    t("years_employed", "Years employed", "Years Employed", "household"),
    { key: "married", label: "Are you married?", type: "yesno", section: "household", fill: [{ kind: "radio", pdf: "Are you married", yes: "Yes", no: "No" }] },
    t("spouse_name", "Spouse's name", "Spouses Name", "household"),
    t("dependents", "Number of dependents (include yourself)", "Number of Dependents include yourself", "household", { type: "integer" }),
    t("dependent_ages", "Ages of dependents", "Ages", "household"),
    t("household_members", "Number of household members (include yourself)", "Number of Household members", "household", { type: "integer" }),
    {
      key: "salary_period", label: "How often is the salary paid?", type: "choice", section: "income",
      options: [{ value: "hourly", label: "Hourly" }, { value: "monthly", label: "Monthly" }, { value: "yearly", label: "Yearly" }],
      fill: [{ kind: "options", pdf: { hourly: "Hourly Monthly Yearly", monthly: "Check Box28", yearly: "Check Box29" } }],
    },
    ...incomePair("salary", "Salary", "fill_18", "fill_19"),
    ...incomePair("unemployment", "Unemployment", "fill_21", "fill_22"),
    ...incomePair("social_security_disability", "Social Security or disability", "fill_24", "fill_25"),
    ...incomePair("afdc", "AFDC", "fill_27", "fill_28"),
    ...incomePair("child_support", "Child support", "fill_30", "fill_31"),
    ...incomePair("savings_account", "Savings account", "fill_33", "fill_34"),
    ...incomePair("checking_account", "Checking account", "fill_36", "fill_37"),
    t("other_income_source", "Other income: what is it?", "Other", "income"),
    ...incomePair("other_income", "Other income", "fill_39", "fill_40"),
    {
      key: "documents_attached", label: "Documents you are attaching", type: "multichoice", section: "documents", options: EMORY_DOCS,
      fill: [{ kind: "options", pdf: {
        pay_stubs: "Check Box30", tax_return: "Check Box31", irs_1040: "Check Box32", w2: "Check Box33",
        income_award_letter: "Check Box34", unemployment_denial: "Check Box35", bank_statements: "Check Box36", other_income_attestation: "Check Box37",
      } }],
    },
    t("signer_print_name", "Patient's / guarantor's full name (printed)", "Please print full name", "signature"),
    t("spouse_print_name", "Spouse's full name (printed, if applicable)", "Please print full name_2", "signature"),
  ],
  lists: [],
  prefill: (i) => ({ state: i.state, household_members: i.household_size }),
  skip: {
    "Date": "Signature date: written by the signer.",
    "Date_2": "Spouse signature date: written by the signer.",
    "Signature26_es_:signer:signature": "Signature: never generated. The applicant signs by hand.",
    "Signature27_es_:signer:signature": "Signature: never generated. The spouse signs by hand.",
  },
};

// ───────────────────────── Grady ─────────────────────────
const MARITAL: Option[] = [
  { value: "never_married", label: "Never married" },
  { value: "married", label: "Married" },
  { value: "separated", label: "Separated" },
  { value: "divorced", label: "Divorced" },
  { value: "widowed", label: "Widowed" },
];
const PAY_PERIOD: Option[] = [
  { value: "weekly", label: "Weekly" },
  { value: "bi_weekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
];
const grady: FormDef = {
  id: "grady",
  file: "grady.pdf",
  title: "Grady Health System Financial Assistance Application",
  sections: [
    { id: "patient", title: "Patient" },
    { id: "insurance", title: "Insurance" },
    { id: "contact", title: "Emergency contact" },
    { id: "income", title: "Financial information" },
  ],
  fields: [
    t("date", "Date", "DATE", "patient", { type: "date" }),
    t("medical_record_number", "MR#", "MR", "patient", { help: "On a Grady bill or card. Optional." }),
    t("ssn", "Social Security number", "SOCIAL SECURITY", "patient", { type: "ssn" }),
    t("patient_name", "Name (last, first, middle)", "NAME LAST FIRST MIDDLE", "patient", { required: true }),
    t("address", "Address (number, street, apt. #)", "ADDRESS", "patient", { required: true }),
    t("city", "City", "CITY", "patient", { required: true }),
    t("county", "County", "COUNTY", "patient", { required: true }),
    t("state", "State", "STATE", "patient", { type: "state", required: true }),
    t("zip", "ZIP code", "ZIP", "patient", { type: "zip", required: true }),
    t("home_phone", "Home telephone", "HOME_PHONE", "patient", { type: "phone", required: true }),
    t("work_phone", "Work telephone", "WORK_PHONE", "patient", { type: "phone" }),
    t("sex", "Sex", "SEX", "patient"),
    t("date_of_birth", "Date of birth", "DATE_OF_BIRTH", "patient", { type: "date", required: true }),
    t("place_of_birth", "Place of birth (city / state, or local hospital name)", "SPLACE OF BIRTH", "patient"),
    t("race", "Race", "RACE", "patient"),
    t("religion", "Religion", "RELIGION", "patient"),
    t("primary_language", "Primary language", "PRIMARY LANGUAGE", "patient"),
    {
      key: "marital_status", label: "Marital status", type: "choice", section: "patient", options: MARITAL,
      fill: [{ kind: "options", pdf: { never_married: "NEVER_MARRIED", married: "MARRIED", separated: "SEPARATED", divorced: "DIVORCED", widowed: "WIDOWED" } }],
    },
    yesNoChecks("treated_at_grady_before", "Have you been treated previously at Grady?", "YES_TREATED_GRADY", "NO_TREATED_GRADY", "patient"),
    t("mothers_maiden_name", "If no, mother's maiden name", "IF NO MOTHERS MAIDEN NAME", "patient"),
    t("employer", "Employer", "EMPLOYER", "patient"),
    t("insurance_company", "Insurance company (name, address, phone)", "INSURANCE COMPANY", "insurance"),
    t("insurance_policy", "Insurance (name, group #, policy #)", "OTHER INSURANCE COVERAGE", "insurance"),
    yesNoChecks("spouse_has_insurance", "Spouse's hospital / medical insurance?", "YES_SPOUSE_INSURANCE", "NO_SPOUSE_INSURANCE", "insurance"),
    t("spouse_insurance_company", "Spouse's insurance company", "INSURANCE COMPANY_2", "insurance"),
    t("medicare_number", "Medicare #", "MEDICARE", "insurance"),
    t("medicaid_number", "Medicaid #", "MEDICAID", "insurance"),
    t("dependents_under_18", "Number of dependents under 18", "OF DEPENDENTS UNDER 18", "insurance", { type: "integer" }),
    t("emergency_contact", "Emergency contact", "EMERGENCY CONTACT", "contact"),
    t("emergency_relationship", "Relationship", "RELATIONSHIP", "contact"),
    t("emergency_address", "Address", "ADDRESS_2", "contact"),
    t("emergency_phone", "Telephone", "undefined", "contact", { type: "phone" }),
    // The PDF reuses the CITY / STATE / ZIP fields on page 2, so a normal fill would copy the patient's
    // city onto the emergency contact's address. The page-2 widget is detached and drawn separately.
    { key: "emergency_city", label: "City", type: "text", section: "contact", fill: [{ kind: "widget", pdf: "CITY", page: 1 }] },
    { key: "emergency_state", label: "State", type: "state", section: "contact", fill: [{ kind: "widget", pdf: "STATE", page: 1 }] },
    { key: "emergency_zip", label: "ZIP code", type: "zip", section: "contact", fill: [{ kind: "widget", pdf: "ZIP", page: 1 }] },
    money("gross_income_self", "Gross income (self)", "GROSS SELF INCOME", "income"),
    {
      key: "gross_income_self_period", label: "Self income is paid", type: "choice", section: "income", options: PAY_PERIOD,
      fill: [{ kind: "options", pdf: { weekly: "WEEKLY_SELF GROSS", bi_weekly: "BI_WEEKLY_SELF_GROSS", monthly: "MONTHLY_SELF_GROSS" } }],
    },
    money("gross_income_spouse", "Gross income (spouse)", "GROSS SPOUSE INCOME 1", "income"),
    {
      key: "gross_income_spouse_period", label: "Spouse income is paid", type: "choice", section: "income", options: PAY_PERIOD,
      fill: [{ kind: "options", pdf: { weekly: "WEEKLY_SPOUSE_GROSS", bi_weekly: "BI_WEEKLY_SPOUSE_GROSS", monthly: "MONTHLY_SPOUSE_GROSS" } }],
    },
  ],
  lists: [],
  prefill: (i) => ({ state: i.state, county: i.county }),
  skip: {
    "GROSS SPOUSE INCOME 2": "Unlabelled full-width line under the spouse income row; its purpose is not printed on the form.",
    "FOR INTERNAL USE ONLY ANNUAL INCOME 1": "Office use: 'For internal use only'.",
    "FOR INTERNAL USE ONLY ANNUAL INCOME 2": "Office use: 'For internal use only'.",
    "Signature1_es_:signer:signature": "Signature: never generated. The patient or representative signs by hand.",
    "Signature2_es_:signer:signature": "Signature: never generated. The financial counselor signs.",
  },
};

export const FORMS: Record<string, FormDef> = { piedmont, emory, grady };
export const FORM_IDS = Object.keys(FORMS);
export const getForm = (id: string): FormDef | null => (Object.prototype.hasOwnProperty.call(FORMS, id) ? FORMS[id] : null);
export type { Answers };
