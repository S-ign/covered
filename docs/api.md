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
