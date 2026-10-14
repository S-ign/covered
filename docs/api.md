# Covered API

Three JSON route handlers under `src/app/api/`. Types are in `src/lib/types.ts`; eligibility rules are in `src/lib/engine.ts`. No auth, no database: every answer comes from `data/hospitals.json` and `data/fpl-2026.json`.

Base URL in development: `http://localhost:3000`

Errors are always JSON: `{ "error": "<readable message>" }`.

| Status | Meaning |
|---|---|
| 200 | Success |
| 400 | Body is not JSON, or a field is missing/invalid |
| 404 | `hospital_id` is not in `data/hospitals.json` |
| 500 | Unexpected server error (a bug; please report) |

## Manual testing

```bash
npm run dev                 # terminal 1
./scripts/smoke.sh          # terminal 2: prints the three personas' results
```

`api.http` at the repo root has every request below, ready to send from VS Code (REST Client extension) or any JetBrains IDE. Point `scripts/smoke.sh` elsewhere with `BASE=https://... ./scripts/smoke.sh`.

---

## `GET /api/hospitals`

Returns every hospital policy, in file order.

```bash
curl -s localhost:3000/api/hospitals
```

```json
{ "hospitals": [ { "id": "piedmont", "name": "Piedmont Healthcare", "tiers": [...], ... }, ... ] }
```

Each entry is a `HospitalPolicy`. The current ids are `piedmont`, `emory` and `grady`.

---

## `POST /api/eligibility`

Computes what a household's bill drops to under one hospital's published policy.

### Request body (`EligibilityInput`)

| Field | Type | Rule |
|---|---|---|
| `hospital_id` | string | Must match a hospital `id`, otherwise 404 |
| `household_size` | number | Whole number, 1 to 20 |
| `annual_income` | number | 0 or more, dollars |
| `bill_amount` | number | Greater than 0, dollars (cents allowed) |
| `insurance_status` | `"uninsured"` \| `"underinsured"` | Exact string |
| `county` | string | Not blank. Matched case-insensitively and with surrounding spaces ignored |
| `state` | string | Optional. Defaults to `"GA"` when missing or empty |

**Number coercion.** Numeric fields accept a JSON number or a numeric string such as `"38000"` or `" 9400.50 "`, so a client can pass query-string values straight through. Anything else (`""`, `" "`, `"abc"`, `"9,400"`, `"1e3"`, `true`, `[]`, `null`) is treated as invalid and gets a 400. It is never read as 0.

### Example

```bash
curl -s localhost:3000/api/eligibility -H 'content-type: application/json' -d '{
  "hospital_id": "emory", "household_size": 3, "annual_income": 65000,
  "bill_amount": 9400, "insurance_status": "uninsured", "county": "Fulton", "state": "GA"
}'
```

```json
{
  "hospital": "emory",
  "hospital_name": "Emory Healthcare",
  "household_size": 3,
  "annual_income": 65000,
  "insurance_status": "uninsured",
  "county": "Fulton",
  "state": "GA",
  "fpl_base": 26650,
  "fpl_pct": 244,
  "tier_matched": { "max_fpl_pct": null, "discount_pct": 35, "applies_to": "uninsured", "note": "Requires enrolling in a payment plan" },
  "status": "discounted",
  "bill_before": 9400,
  "bill_after": 6110,
  "residency_ok": true,
  "residency": { "type": "none" },
  "documents_required": ["..."],
  "application_url": "https://...",
  "mailing_address": null,
  "source_url": "https://...",
  "policy_date": "unknown",
  "policy_conflicts": [ { "claim": "...", "source_url": "https://...", "note": "..." } ],
  "verified": false
}
```

### How the result is computed

1. `fpl_base` is the FPL figure for the household size. Sizes over 8 add `additional_person` for each extra person.
2. `fpl_pct = round(annual_income / fpl_base * 100)`, a whole number.
3. `tier_matched` is the first tier, in file order, whose `applies_to` is `"any"` or equals `insurance_status`, and whose `max_fpl_pct` is `null` or at least `fpl_pct`.
4. `status` and `bill_after`:

| Tier | `status` | `bill_after` |
|---|---|---|
| none matched | `no_match` | `null` |
| `discount_pct: null` | `eligible_sliding_scale` | `null` (the hospital sets the amount; never show a dollar figure) |
| `discount_pct: 100` | `free` | `0` |
| any other % | `discounted` | `bill_amount * (1 - pct/100)`, rounded to cents |

5. `residency_ok` reports whether the household meets the hospital's residency rule. It is a warning only: it never changes `status`.
6. `source_url` is the hospital's `policy_url`. Every figure shown to a user should link to it.

### Errors

| Input | Status | `error` |
|---|---|---|
| Body is not JSON | 400 | `Body must be JSON` |
| Unknown or missing `hospital_id` | 404 | `Unknown hospital: <id>` |
| Bad `household_size` | 400 | `household_size must be a whole number from 1 to 20` |
| Bad `annual_income` | 400 | `annual_income must be a number of 0 or more` |
| Bad `bill_amount` | 400 | `bill_amount must be a number greater than 0` |
| Bad `insurance_status` | 400 | `insurance_status must be "uninsured" or "underinsured"` |
| Blank `county` | 400 | `county is required` |

The hospital is looked up before the other fields are checked, so an unknown hospital returns 404 even when other fields are also invalid. When several fields are invalid, the error names the first one in the order above.

---

## `POST /api/application`

Returns a one-page, mailable application PDF. The server recomputes eligibility from `input`; it never trusts a result sent by the client.

### Request body (`ApplicationRequest`)

```json
{
  "input": { "...": "same fields as POST /api/eligibility" },
  "applicant": {
    "full_name": "Maria Lopez",
    "mailing_address": "123 Peachtree St\nAtlanta, GA 30303",
    "phone": "404-555-0100",
    "date_of_birth": "1988-04-12"
  }
}
```

All four `applicant` fields are required and are trimmed. Use `\n` in `mailing_address` for separate lines. `date_of_birth` is printed as given; its format is not checked.

### Response

`200`, `content-type: application/pdf`, `content-disposition: attachment; filename="covered-<hospital_id>-application.pdf"`.

```bash
curl -s localhost:3000/api/application -H 'content-type: application/json' -o app.pdf -d '{
  "input": { "hospital_id": "piedmont", "household_size": 3, "annual_income": 38000, "bill_amount": 9400,
             "insurance_status": "uninsured", "county": "Fulton", "state": "GA" },
  "applicant": { "full_name": "Maria Lopez", "mailing_address": "123 Peachtree St\nAtlanta, GA 30303",
                 "phone": "404-555-0100", "date_of_birth": "1988-04-12" }
}' && open app.pdf
```

### PDF contents and limits

- The PDF has an applicant section, a household section, the eligibility result, a checkbox for each required document, and a "Where to send" section. A footer cites the policy and its URL.
- Dollar amounts are rounded to whole dollars. For example, a bill of $9,400.50 prints as $9,401, while the eligibility API returns cents.
- Lines longer than 90 characters are cut short with `...`.
- The PDF uses a standard Latin font. Accents are removed (`Nguyễn` becomes `Nguyen`), and characters the font cannot show, such as Korean or Chinese, print as `?`.
- For a sliding-scale result, the estimated bill reads "Determined by the hospital".

### Errors

Errors are checked in this order:

| Input | Status | `error` |
|---|---|---|
| Body is not JSON | 400 | `Body must be JSON` |
| Missing or blank applicant field (also a `null` body) | 400 | `applicant.<field> is required` |
| Unknown or missing `input.hospital_id` | 404 | `Unknown hospital: <id>` |
| Invalid `input` field | 400 | same messages as `/api/eligibility` |

---

## Data checks

```bash
npm run validate:data   # checks data/hospitals.json and data/fpl-2026.json
npm test                # engine, validation, API and PDF tests
```

---

## Fillable hospital forms (preview)

> **Preview only.** These routes are on for local development and Vercel Preview deployments. On Vercel Production they answer `404 {"error":"Not found"}` unless `ENABLE_FORMS_API=1` is set on purpose. They are not used by the site yet.

Unlike `POST /api/application` (our own one-page summary), these routes fill **the hospital's own fillable application PDF** (`data/forms/piedmont.pdf`, `emory.pdf`, `grady.pdf`) using its real AcroForm field names. The PDF stays editable by default so the applicant can check it and sign. Signatures, witness lines, signature dates and office-use boxes are never filled.

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/forms` | Hospitals that have a fillable form |
| GET | `/api/forms/{hospital}` | The questions for that form: sections, fields, types, options, required flags |
| POST | `/api/forms/{hospital}/validate` | Check answers; lists what is missing or wrong. No PDF |
| POST | `/api/forms/{hospital}` | Returns the filled PDF |

`{hospital}` is `piedmont`, `emory` or `grady`. Responses carry `x-robots-tag: noindex` and `cache-control: no-store`. Nothing is stored; answers exist only for the length of the request.

### Request body (fill and validate)

```json
{
  "input": { "hospital_id": "piedmont", "household_size": 3, "annual_income": 38000, "bill_amount": 9400,
             "insurance_status": "uninsured", "county": "Fulton", "state": "GA" },
  "answers": {
    "patient_name": "Lopez, Maria",
    "date_of_birth": "1988-04-12",
    "physical_address": "123 Peachtree St NE",
    "city": "Atlanta", "state": "GA", "zip": "30303",
    "phone": "404-555-0100",
    "household_members": [
      { "name": "Lopez, Maria", "date_of_birth": "1988-04-12", "age": 38, "relation": "Self", "annual_income": 38000 }
    ],
    "has_medicaid": false
  },
  "draft": false,
  "flatten": false
}
```

- `answers` uses the keys returned by `GET /api/forms/{hospital}`. Unknown keys are rejected so a typo cannot silently drop data.
- `input` is optional. When given it must be valid like `POST /api/eligibility` and its `hospital_id` must match the URL. It pre-fills what we already know (state, county, household income or size, and "has health insurance" for Piedmont). Anything in `answers` overrides it.
- `draft: true` skips the required-field check so a half-finished form can still be downloaded.
- `flatten: true` burns the answers into the page. The default keeps the PDF fillable.

### Value formats

| Type | Accepts | Printed as |
|---|---|---|
| `date` | `1988-04-12` or `04/12/1988` | `04/12/1988` |
| `ssn` | 9 digits, spaces or dashes allowed | `123-45-6789` |
| `phone` | 10-digit US number, `+1` allowed | `404-555-0100` |
| `zip` | `30303` or `30303-1234` | as given |
| `state` | 2 letters | upper case |
| `money` | `38000`, `$38,000.5` | `38,000` or `38,000.50` |
| `integer` | whole number 0-999 | as given |
| `yesno` | `true`/`false`/`"yes"`/`"no"` | selects Yes or No |
| `choice` | one option `value` | ticks that box |
| `multichoice` | list of option `value`s | ticks those boxes |
| `text` | up to 120 characters (220 multiline) | accents removed, unsupported characters printed as `?` |

### Errors

| Case | Status | Body |
|---|---|---|
| Unknown hospital | 404 | `{ "error": "Unknown hospital form: <id>" }` |
| Body not JSON / not an object | 400 | `{ "error": "Body must be JSON" }` |
| `input` invalid or for another hospital | 400 | same messages as `/api/eligibility` |
| Answers missing or malformed | 400 | `{ "error": "Some answers need fixing", "problems": ["Patient full name: required", "Phone number: must be a 10-digit US phone number"] }` |

`/validate` always returns `200` with `{ ok, missing_required, problems, can_download_draft }`.

```bash
curl -s localhost:3000/api/forms/piedmont -H 'content-type: application/json' -o piedmont.pdf -d '{
  "input": { "hospital_id": "piedmont", "household_size": 3, "annual_income": 38000, "bill_amount": 9400,
             "insurance_status": "uninsured", "county": "Fulton", "state": "GA" },
  "answers": { "patient_name": "Lopez, Maria", "date_of_birth": "1988-04-12", "physical_address": "123 Peachtree St NE",
               "city": "Atlanta", "zip": "30303", "phone": "404-555-0100" }
}'
```

### Adding or changing a form

Field mappings live in `src/lib/forms/definitions.ts`. `npm run pdf:fields data/forms/<id>.pdf` lists a PDF's real field names. `tests/forms.test.ts` fails if a PDF field is neither mapped nor listed in that form's `skip` (with a reason), or if a mapping names a field the PDF does not have.

Known limits: the three PDFs were supplied as-is. Grady's PDF reuses the `CITY`/`STATE`/`ZIP` field names on page 2 for the emergency contact, so those widgets are drawn separately. Piedmont's household table has 4 rows. Piedmont's second box under "Describe below:" and Grady's unlabelled spouse-income line are left blank because the forms do not say what goes there.
