# Generations Covered: Design Spec

Date: 2026-10-10
Event: Hack for Humanity Fall 2026, Atlanta
Build window: 2 hours, hard freeze at 1:50
Source proposal: `docs/hfh-atl-gchrn.md`

## 1. What we are building

Generations Covered ("Covered" for short) takes a patient's hospital, household size, annual income, insurance status, county, and bill amount, and produces:

1. The percent of the Federal Poverty Level (FPL) the household sits at.
2. The financial assistance tier the hospital's own published policy puts them in.
3. The number the bill drops to.
4. A completed financial assistance application PDF, ready to mail, with the document checklist.

Every number traces to a hospital policy PDF, linked. No language model touches the eligibility logic. Adding a hospital is adding one entry to a JSON file.

Out of scope on event day: bill photo upload, Spanish, accounts, database, bill error detection, more than one hospital's real application form.

## 2. Decisions already made

| Decision | Choice |
|---|---|
| Stack | Next.js (App Router, TypeScript, Tailwind, `src/` dir), single app |
| Hosting | Vercel, auto-deploy on push to `main`. Demo runs from `localhost`. |
| Repo | GitHub, both developers commit to `main` directly |
| PDF | `pdf-lib`. Generated summary PDF first (guaranteed). Real Piedmont form fill only in the 1:40 slot if the field map exists. |
| Data | Proposal figures baked in and flagged `verified: false`. Data owner overwrites `data/*.json` on the clock. |
| Tests | Vitest on the engine only, one case per persona row. Curl smoke script for the API. No UI tests. |
| LLMs | None in the product |
| Name | Display name lives in one constant: `APP_NAME = "Generations Covered"`, `APP_SHORT = "Covered"` in `src/lib/config.ts` |

## 3. Team split and ownership

Gideon owns the API track. Avery owns the UI track. Neither edits the other's directories.

| Path | Owner | Notes |
|---|---|---|
| `src/lib/**` | Gideon | engine, data loading, pdf, config |
| `src/lib/types.ts` | Gideon writes, **frozen after 0:10** | Any change is announced in chat before push |
| `src/lib/fixtures/**` | Gideon writes, Avery reads | Snapshot for UI development, never updated after 0:10 |
| `src/app/api/**` | Gideon | route handlers |
| `data/**` | Gideon, then data owner | hospitals, FPL table, forms |
| `tests/**`, `scripts/**` | Gideon | |
| `src/app/page.tsx` | Avery | intake page |
| `src/app/result/**` | Avery | result page |
| `src/components/**` | Avery | |
| `src/app/layout.tsx`, `src/app/globals.css` | Avery | |
| `package.json` | Gideon | Avery asks in chat before adding a dependency |

Git routine for both: small commits, `git pull --rebase origin main` before every `git push`. Push at least every 20 minutes.

## 4. Units

Each unit is demoable alone, in this order.

| # | Unit | Owner | Done when |
|---|---|---|---|
| 1 | Contract: `types.ts` + fixtures | Gideon | Pushed by 0:10. Avery's dev server renders a fixture. |
| 2 | Data: `data/hospitals.json`, `data/fpl-2026.json`, `scripts/validate-data.ts` | Gideon | `npm run validate:data` passes |
| 3 | Engine: `src/lib/engine.ts`, pure function | Gideon | `npm test` passes all persona cases |
| 4 | API: three route handlers | Gideon | `scripts/smoke.sh` returns expected numbers |
| 5 | Intake page | Avery | Submits to `/result?...` with a correct query string |
| 6 | Result page + application panel | Avery | Renders Maria from fixture, then from API |
| 7 | PDF: generated, then real form | Gideon | `curl` saves a PDF that opens and shows Maria's numbers |

## 5. Contracts

### 5.1 `src/lib/types.ts` (frozen after 0:10)

```ts
export type InsuranceStatus = "uninsured" | "underinsured";

export type Residency =
  | { type: "none" }
  | { type: "state"; values: string[] }     // e.g. ["GA"]
  | { type: "county"; values: string[] };   // e.g. ["Fulton", "DeKalb"]

export interface Tier {
  max_fpl_pct: number | null;      // null = no upper cap
  discount_pct: number | null;     // null = eligible, amount set by hospital's sliding scale
  applies_to: InsuranceStatus | "any";
  note?: string;                   // e.g. "requires a payment plan"
}

export interface PolicyConflict {
  claim: string;                   // "Free care up to 350% FPL for uninsured"
  source_url: string;
  note: string;
}

export interface HospitalPolicy {
  id: string;                      // "piedmont"
  name: string;                    // "Piedmont Healthcare"
  policy_url: string;
  policy_date: string;             // "2026-03" or "unknown"
  application_url: string;         // where the patient downloads the real form
  mailing_address: string | null;  // where to mail it, null if not yet verified
  residency: Residency;
  tiers: Tier[];                   // sorted by max_fpl_pct ascending, null last
  documents_required: string[];
  policy_conflicts: PolicyConflict[];
  verified: boolean;               // data owner flips to true after checking the PDF
  notes?: string;
}

export interface FplTable {
  year: number;
  source_url: string;
  verified: boolean;
  note?: string;
  by_size: Record<string, number>;   // keys "1".."8"
  additional_person: number;
}

export interface EligibilityInput {
  hospital_id: string;
  household_size: number;          // integer, 1..20
  annual_income: number;           // dollars, >= 0
  bill_amount: number;             // dollars, > 0
  insurance_status: InsuranceStatus;
  county: string;                  // "Fulton"
  state: string;                   // always "GA" for the event
}

export type EligibilityStatus =
  | "free"                         // discount_pct === 100
  | "discounted"                   // 0 < discount_pct < 100
  | "eligible_sliding_scale"       // tier matched, discount_pct null
  | "no_match";                    // no tier matched

export interface EligibilityResult {
  hospital: string;                // hospital id
  hospital_name: string;
  household_size: number;
  annual_income: number;
  insurance_status: InsuranceStatus;
  county: string;
  state: string;
  fpl_base: number;                // FPL dollar figure for this household size
  fpl_pct: number;                 // whole number
  tier_matched: Tier | null;
  status: EligibilityStatus;
  bill_before: number;
  bill_after: number | null;       // null when status is eligible_sliding_scale or no_match
  residency_ok: boolean;           // warning, not a block
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
  mailing_address: string;         // multi-line allowed
  phone: string;
  date_of_birth: string;           // "YYYY-MM-DD"
}

export interface ApplicationRequest {
  input: EligibilityInput;
  applicant: Applicant;
}
```

### 5.2 Engine rules (`src/lib/engine.ts`)

`computeEligibility(input, hospital, fplTable): EligibilityResult`. Pure. No I/O. Throws on invalid input with a message the API turns into a 400.

1. **Validate.** `household_size` is an integer 1..20. `annual_income >= 0`. `bill_amount > 0`. `insurance_status` is in the enum. `county` is a non-empty string.
2. **FPL base.** `fplTable.by_size[household_size]` for sizes 1..8. For sizes above 8: `by_size[8] + (household_size - 8) * fplTable.additional_person`.
3. **FPL percent.** `Math.round(annual_income / fpl_base * 100)`.
4. **Tier match.** Walk `hospital.tiers` in order (already sorted ascending by `max_fpl_pct`, nulls last). The first tier where both hold wins:
   - `tier.applies_to === "any" || tier.applies_to === input.insurance_status`
   - `tier.max_fpl_pct === null || fpl_pct <= tier.max_fpl_pct`
5. **Status and bill.**
   - no tier: `status = "no_match"`, `bill_after = null`
   - `discount_pct === null`: `status = "eligible_sliding_scale"`, `bill_after = null`
   - `discount_pct === 100`: `status = "free"`, `bill_after = 0`
   - otherwise: `status = "discounted"`, `bill_after = round2(bill_amount * (1 - discount_pct / 100))` where `round2` rounds to cents
6. **Residency.** `type none` is always ok. `type state`: `values` includes `input.state`. `type county`: `values` includes `input.county`, case-insensitive, trimmed. Residency never changes status or bill. It sets `residency_ok` and the UI shows a warning.
7. Copy `documents_required`, `application_url`, `mailing_address`, `policy_url` as `source_url`, `policy_date`, `policy_conflicts`, `verified` from the hospital onto the result. Copy `household_size`, `annual_income`, `insurance_status`, `county`, `state`, and `bill_amount` (as `bill_before`) from the input.
8. **Data loading.** `src/lib/data.ts` imports `data/hospitals.json` and `data/fpl-2026.json` statically. Next.js dev reloads JSON imports on change, and static imports are always bundled on Vercel. Do not read `data/` with `fs` at request time.

### 5.3 FPL table (`data/fpl-2026.json`)

Figures below are the 2025 HHS guidelines for the 48 contiguous states, used as placeholders. Data owner replaces with the 2026 table and sets `verified: true`.

```json
{
  "year": 2026,
  "source_url": "https://aspe.hhs.gov/topics/poverty-economic-mobility/poverty-guidelines",
  "verified": false,
  "note": "PLACEHOLDER: 2025 figures. Replace with 2026 HHS guidelines.",
  "by_size": {
    "1": 15650, "2": 21150, "3": 26650, "4": 32150,
    "5": 37650, "6": 43150, "7": 48650, "8": 54150
  },
  "additional_person": 5500
}
```

### 5.4 Hospital data (`data/hospitals.json`)

Every figure is from the proposal. `verified: false` everywhere until the data owner checks it against the PDF. Document lists are generic placeholders.

```json
{
  "hospitals": [
    {
      "id": "piedmont",
      "name": "Piedmont Healthcare",
      "policy_url": "https://Piedmont.org/media/file/Financial-Assistance-Policy.pdf",
      "policy_date": "unknown",
      "application_url": "https://Piedmont.org/media/file/Financial-Assistance-Policy.pdf",
      "mailing_address": null,
      "residency": { "type": "state", "values": ["GA"] },
      "tiers": [
        { "max_fpl_pct": 300, "discount_pct": 100, "applies_to": "uninsured" }
      ],
      "documents_required": [
        "Most recent federal tax return",
        "Two most recent pay stubs or proof of income",
        "Government-issued photo ID",
        "The hospital bill or account statement"
      ],
      "policy_conflicts": [],
      "verified": false,
      "notes": "Partial-discount tiers above 300% and underinsured tiers not yet pulled from PDF."
    },
    {
      "id": "emory",
      "name": "Emory Healthcare",
      "policy_url": "https://www.emoryhealthcare.org/-/media/Project/EH/Emory/ui/insurance/ehc-financial-assistance-policy.pdf",
      "policy_date": "unknown",
      "application_url": "https://www.emoryhealthcare.org/patients-visitors/insurance-billing/financial-assistance",
      "mailing_address": null,
      "residency": { "type": "none" },
      "tiers": [
        { "max_fpl_pct": 125, "discount_pct": 100, "applies_to": "underinsured" },
        { "max_fpl_pct": 225, "discount_pct": 100, "applies_to": "uninsured" },
        { "max_fpl_pct": null, "discount_pct": 35, "applies_to": "uninsured", "note": "Requires enrolling in a payment plan" }
      ],
      "documents_required": [
        "Most recent federal tax return",
        "Two most recent pay stubs or proof of income",
        "Government-issued photo ID",
        "The hospital bill or account statement"
      ],
      "policy_conflicts": [
        {
          "claim": "Free care for uninsured patients up to 350% FPL",
          "source_url": "https://www.emoryhealthcare.org/patients-visitors/insurance-billing/financial-assistance",
          "note": "Emory's public web page says 350%. Emory's policy PDF says 225%. This app uses the PDF. Call Emory Financial Services at 404-778-7318 to confirm which applies to you."
        }
      ],
      "verified": false
    },
    {
      "id": "grady",
      "name": "Grady Health System",
      "policy_url": "https://www.gradyhealth.org/wp-content/uploads/HB-321-2L-Grady-FAP-Policy-1_Approved-March-20-2026.pdf",
      "policy_date": "2026-03",
      "application_url": "https://www.gradyhealth.org/wp-content/uploads/HB-321-2L-Grady-FAP-Policy-1_Approved-March-20-2026.pdf",
      "mailing_address": null,
      "residency": { "type": "county", "values": ["Fulton", "DeKalb"] },
      "tiers": [
        { "max_fpl_pct": 400, "discount_pct": null, "applies_to": "any", "note": "Sliding scale by FPL tier. Exact discount percentages to be pulled from the PDF." }
      ],
      "documents_required": [
        "Proof of Fulton or DeKalb County residency",
        "Most recent federal tax return",
        "Two most recent pay stubs or proof of income",
        "Government-issued photo ID"
      ],
      "policy_conflicts": [],
      "verified": false,
      "notes": "Policy says up to 400% FPL is eligible for assistance, not that it is free. Tiers pending."
    }
  ]
}
```

`scripts/validate-data.ts` checks: ids unique and lowercase, tiers sorted ascending with nulls last, `discount_pct` in 0..100 or null, every `applies_to` in the enum, every URL starts with `https://`, every `by_size` key 1..8 present and increasing.

### 5.5 API

All routes under `src/app/api/`. JSON errors are `{ "error": "message" }`.

**`GET /api/hospitals`** → `200 { "hospitals": HospitalPolicy[] }`

**`POST /api/eligibility`** body `EligibilityInput` → `200 EligibilityResult`. `400` on validation failure. `404` on unknown `hospital_id`.

Example:

```bash
curl -s localhost:3000/api/eligibility -H 'content-type: application/json' -d '{
  "hospital_id":"piedmont","household_size":3,"annual_income":38000,
  "bill_amount":9400,"insurance_status":"uninsured","county":"Fulton","state":"GA"
}'
```

Returns (abridged):

```json
{
  "hospital": "piedmont", "hospital_name": "Piedmont Healthcare",
  "fpl_base": 26650, "fpl_pct": 143,
  "tier_matched": { "max_fpl_pct": 300, "discount_pct": 100, "applies_to": "uninsured" },
  "status": "free", "bill_before": 9400, "bill_after": 0,
  "residency_ok": true, "source_url": "https://Piedmont.org/media/file/Financial-Assistance-Policy.pdf",
  "verified": false
}
```

**`POST /api/application`** body `ApplicationRequest` → `200 application/pdf`, header `Content-Disposition: attachment; filename="covered-piedmont-application.pdf"`. `400` on validation failure. The server recomputes eligibility from `input`; it never trusts a client-supplied result. `export const runtime = "nodejs"` on this route.

### 5.6 Fixtures (`src/lib/fixtures/`)

- `hospitals.json`: identical copy of `data/hospitals.json` at 0:10.
- `results.json`: an object keyed by persona key, each an `EligibilityResult` computed by hand from section 6. Keys: `maria-piedmont`, `maria-emory`, `johnsons-emory`, `johnsons-piedmont`, `darnell-grady`, `darnell-grady-cobb`.

Avery imports these until the 1:05 integration checkpoint.

## 6. Personas

These are the engine's test cases and the UI's fixtures. Expected values use the placeholder FPL table.

| Key | Inputs | fpl_pct | status | bill_after | residency_ok | notes |
|---|---|---|---|---|---|---|
| `maria-piedmont` | piedmont, 3, $38,000, $9,400, uninsured, Fulton | 143 | free | 0 | true | **The demo number: $9,400 to $0** |
| `maria-emory` | emory, same | 143 | free | 0 | true | conflict note shown |
| `johnsons-emory` | emory, 3, $65,000, $9,400, uninsured, Fulton | 244 | discounted (35%) | 6110 | true | conflict note: web page would call them free |
| `johnsons-piedmont` | piedmont, same | 244 | free | 0 | true | "same engine, different answer" beat |
| `darnell-grady` | grady, 2, $50,000, $4,200, uninsured, DeKalb | 236 | eligible_sliding_scale | null | true | |
| `darnell-grady-cobb` | grady, same, Cobb | 236 | eligible_sliding_scale | null | **false** | residency warning |

Extra engine tests, not fixtures: household of 10 uses the additional-person increment; `emory` underinsured at 150% is `no_match`; household_size 0 throws; bill_amount 0 throws.

## 7. Pages

Two routes. The intake page never calls the API.

### 7.1 `/` intake

Fields: hospital (select, from fixtures then from `GET /api/hospitals`), household size (number, 1..20), annual household income (number, dollars), insurance status (two radio buttons: "I have no insurance" = uninsured, "I have insurance but can't afford the bill" = underinsured), county (select: Fulton, DeKalb, Cobb, Gwinnett, Clayton, Other), bill amount (number, dollars). State is fixed to GA and not shown.

Submit navigates to `/result?hospital=piedmont&size=3&income=38000&bill=9400&insurance=uninsured&county=Fulton`. Client-side validation only prevents empty or negative fields.

### 7.2 `/result`

Reads the query string, builds an `EligibilityInput`, calls `POST /api/eligibility`, renders:

1. **Headline**: bill before and bill after, big. For `free`: "Your bill drops to $0." For `discounted`: "Your bill drops to $6,110." For `eligible_sliding_scale`: "You qualify for assistance. {Hospital} sets the discount on a sliding scale." For `no_match`: "No published tier matches. Call {Hospital}'s financial counselor."
2. **How we got here**: household size, income, FPL percent, the tier matched, with "Source: {Hospital} policy, {policy_date}" linked to `source_url`.
3. **Residency warning** if `residency_ok` is false: "{Hospital}'s policy covers {values} residents. You entered {county}."
4. **Conflict note** if `policy_conflicts` is non-empty: a highlighted box with the claim, note, and link.
5. **Verification flag** if `verified` is false: small text "Figures pending verification against the policy PDF."
6. **Hospital switcher**: a select that rewrites the `hospital` query param and reloads the result. This is the demo's "same engine, different answer" beat.
7. **Prepare application** button: reveals four fields (full name, mailing address, phone, date of birth) and a "Download application PDF" button that POSTs to `/api/application` and saves the response as a file. Below it, the document checklist and a link to `application_url`.
8. **Sources footer**: every hospital's policy link.

Loading and error states: a one-line "Checking {Hospital}'s policy..." and a one-line error with a "Back" link.

## 8. PDF

### 8.1 Generated PDF (`src/lib/pdf/generated.ts`), built first

US Letter, one page, pdf-lib standard fonts. Sections, top to bottom:

- Title: "Financial Assistance Application: {Hospital name}"
- Subtitle: "Prepared with {APP_NAME} on {date}"
- Applicant: name, mailing address, phone, date of birth
- Household: size, annual income, insurance status, county
- Eligibility under the hospital's published policy: FPL percent, tier matched, bill before, estimated bill after (or "set by hospital sliding scale")
- Documents to include: one checkbox square per `documents_required` item
- Where to send: `mailing_address`, or "See the hospital's policy for the mailing address" when null
- Footer: "Figures from {Hospital}'s financial assistance policy, {policy_date}, {source_url}. Final eligibility is determined by the hospital."

### 8.2 Real form fill (`src/lib/pdf/form-fill.ts`), 1:40 slot only

Preconditions: `data/forms/piedmont.pdf` exists, `data/forms/piedmont-fields.json` exists mapping our field names to the PDF's form field names, and the generated PDF is done and demoed. `scripts/list-pdf-fields.ts` prints the field names of any PDF to build the map.

The application route tries the real form when the mapping file exists for that hospital and falls back to the generated PDF on any error. Fallback is silent to the user; the server logs the error.

## 9. Timeline (2 hours)

| Clock | Gideon | Avery |
|---|---|---|
| 0:00 | Screenshot empty directory. `create-next-app`. Add `pdf-lib`, `vitest`. Write `types.ts`, `config.ts`, fixtures. Push. | Wait for the push. Read the brief. |
| 0:10 | Data files, validate script. Persona tests first, then engine. | Clone, `npm install`, `npm run dev`, confirm it renders. Start intake page from fixtures. |
| 0:45 | API routes. Smoke script. Push. | Result page from fixtures. |
| 1:05 | **Integration checkpoint.** Avery swaps fixtures for fetch. Both run Maria end to end. | |
| 1:15 | Generated PDF. | Hospital switcher, conflict note, residency warning, sources footer. |
| 1:40 | Real form fill, only if generated PDF is done and field map exists. Otherwise help Avery. | Polish. Mobile check. |
| 1:50 | **Freeze.** Three personas end to end on localhost. Check the Vercel URL. Record the backup. | |
| 2:00 | Done. | |

## 10. Cut list, in order

1. Real form fill. Replace with the generated PDF.
2. Generated PDF. Replace with the document checklist and a link to `application_url`.
3. Source links on the result page. Replace with the sources footer only.
4. Third hospital. Demo with Piedmont and Emory.

Never attempted: bill photo upload, Spanish, accounts, database, bill error detection.

## 11. Pre-event checklist (allowed by the rules: no code)

- [ ] GitHub repo `covered` created, README only. Avery has write access.
- [ ] Vercel project linked to the repo, framework preset Next.js, deploys from `main`. Optional: push a throwaway `create-next-app`, confirm the deploy works, then force-push back to README only.
- [ ] Both machines: Node 20+, `npm`, git configured, repo cloned.
- [ ] Avery's AI tool has `docs/avery-ui-brief.md` ready to paste.
- [ ] Gideon's Claude Code has `docs/gideon-api-brief.md` ready to paste.
- [ ] Piedmont's application PDF downloaded to a known location. If it has fillable fields, the field map is drafted in a sheet.
- [ ] Data owner has the tier sheet open and knows the schema in section 5.4.

## 12. Design direction for the UI

Warm and plain, not clinical. One typeface. A calm neutral background with one accent color used only for the result headline and primary buttons. The $9,400 to $0 moment is the biggest thing on the result page. Everything else is quiet. Mobile first, because judges will open the Vercel link on their phones. No dashboards, no cards for the sake of cards. Policy links are visible and underlined; they are the trust signal.
