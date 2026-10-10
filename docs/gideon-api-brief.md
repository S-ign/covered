# Covered: API Brief for Gideon

Paste this into Claude Code at minute zero together with `docs/superpowers/specs/2026-10-10-covered-design.md`. The spec is the source of truth for every contract. This file is the build order.

## Minute 0 to 10: scaffold and contract

```bash
npx create-next-app@latest covered --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
cd covered
npm i pdf-lib
npm i -D vitest tsx
```

Add to `package.json` scripts:

```json
"test": "vitest run",
"validate:data": "tsx scripts/validate-data.ts",
"pdf:fields": "tsx scripts/list-pdf-fields.ts"
```

Turn off lint blocking the build in `next.config.ts`: `eslint: { ignoreDuringBuilds: true }`.

Write, exactly as in the spec:

- `src/lib/types.ts` (spec 5.1)
- `src/lib/config.ts`: `export const APP_NAME = "Generations Covered"; export const APP_SHORT = "Covered";`
- `data/hospitals.json` (spec 5.4)
- `data/fpl-2026.json` (spec 5.3)
- `src/lib/fixtures/hospitals.json`: copy of `data/hospitals.json`
- `src/lib/fixtures/results.json`: six `EligibilityResult` objects keyed by persona, values from spec section 6, computed by hand. Fill every field of the type.

Commit, push, tell Avery "pushed". **`types.ts` is frozen from here.**

## Minute 10 to 45: data, tests, engine

Test first. `tests/engine.test.ts` with one `it` per row of spec section 6 plus the four extras (household of 10, Emory underinsured at 150% is no_match, size 0 throws, bill 0 throws). Load hospitals and FPL from `data/` directly in the test.

Then `src/lib/engine.ts`:

- `export function computeEligibility(input: EligibilityInput, hospital: HospitalPolicy, fpl: FplTable): EligibilityResult` following spec 5.2 step by step.
- `export class ValidationError extends Error {}` so the API can map it to 400.

`src/lib/data.ts`: `getHospitals()`, `getHospital(id)`, `getFplTable()`. Static `import` of the two JSON files. Next dev reloads them on change, and static imports are always bundled on Vercel.

`scripts/validate-data.ts` per spec 5.4 checks. Exit 1 on any failure with the failing path printed.

Done when `npm test` and `npm run validate:data` both pass.

## Minute 45 to 65: API routes

- `src/app/api/hospitals/route.ts`: `GET` returns `{ hospitals }`.
- `src/app/api/eligibility/route.ts`: `POST`. Parse JSON. Coerce numbers. Unknown hospital 404. `ValidationError` 400. Else 200 with the result.
- `src/app/api/application/route.ts`: `POST`, `export const runtime = "nodejs"`. Until the PDF exists, return 501 `{ error: "not yet" }` so Avery's button fails loudly rather than silently.

`scripts/smoke.sh`:

```bash
#!/usr/bin/env bash
set -e
B=${BASE:-http://localhost:3000}
curl -sf $B/api/hospitals | head -c 200; echo
for p in \
 '{"hospital_id":"piedmont","household_size":3,"annual_income":38000,"bill_amount":9400,"insurance_status":"uninsured","county":"Fulton","state":"GA"}' \
 '{"hospital_id":"emory","household_size":3,"annual_income":65000,"bill_amount":9400,"insurance_status":"uninsured","county":"Fulton","state":"GA"}' \
 '{"hospital_id":"grady","household_size":2,"annual_income":50000,"bill_amount":4200,"insurance_status":"uninsured","county":"Cobb","state":"GA"}'
do
  curl -sf $B/api/eligibility -H 'content-type: application/json' -d "$p" | grep -o '"fpl_pct":[0-9]*,\|"status":"[a-z_]*"\|"bill_after":[0-9.]*\|"bill_after":null\|"residency_ok":[a-z]*' | tr '\n' ' '; echo
done
```

Expected lines: `143 free 0 true`, `244 discounted 6110 true`, `236 eligible_sliding_scale null false`.

Push. Tell Avery "API is up". Run Maria end to end with them at 1:05.

## Minute 75 to 100: generated PDF

`src/lib/pdf/generated.ts`: `export async function renderApplicationPdf(result: EligibilityResult, applicant: Applicant): Promise<Uint8Array>` following spec 8.1. US Letter (612 x 792), Helvetica and Helvetica-Bold, 11pt body, 18pt title. Draw a square for each checklist item. Keep every string under the page width by truncating at 90 characters; no wrapping logic.

Wire the application route: validate `input` and `applicant` (all four applicant strings non-empty), recompute eligibility, render, return with:

```ts
return new Response(bytes, {
  headers: {
    "content-type": "application/pdf",
    "content-disposition": `attachment; filename="covered-${result.hospital}-application.pdf"`,
  },
});
```

Check:

```bash
curl -sf localhost:3000/api/application -H 'content-type: application/json' -d '{"input":{"hospital_id":"piedmont","household_size":3,"annual_income":38000,"bill_amount":9400,"insurance_status":"uninsured","county":"Fulton","state":"GA"},"applicant":{"full_name":"Maria Lopez","mailing_address":"123 Peachtree St\nAtlanta, GA 30303","phone":"404-555-0100","date_of_birth":"1988-04-12"}}' -o /tmp/maria.pdf && open /tmp/maria.pdf
```

Push. Tell Avery "PDF is up".

## Minute 100 to 110: real form, only if all three hold

1. Generated PDF is done and demoed.
2. `data/forms/piedmont.pdf` is in the repo.
3. `npm run pdf:fields data/forms/piedmont.pdf` prints field names and `data/forms/piedmont-fields.json` maps them.

`scripts/list-pdf-fields.ts`: load with pdf-lib, `doc.getForm().getFields().map(f => f.getName())`, print.

`src/lib/pdf/form-fill.ts`: load the form, for each entry in the map set the text field, `form.flatten()`, save. The application route tries this when the map file exists and falls back to `renderApplicationPdf` in a `catch`, logging the error.

If any precondition fails, skip this and help Avery.

## Minute 110: freeze

- Run `scripts/smoke.sh` and the three personas in the browser on localhost.
- Open the Vercel URL. If it is broken, do not fix it. Localhost is the demo.
- Data owner's final `data/*.json` is committed. Run `npm run validate:data` and `npm test` one last time. If a test fails because the real tiers differ from placeholders, update the expected values in the test and the fixture only if there is time. Otherwise note it and move on; the engine is right, the placeholders were wrong.

## Cut decisions you own

| If at | Then |
|---|---|
| 1:05 the API is not up | Avery stays on fixtures. You ship eligibility route only, skip hospitals route (Avery hardcodes the three). |
| 1:40 the PDF is not up | Tell Avery to hide the download button. Checklist and link remain. |
| 1:40 the PDF is up | Attempt the real form only if the preconditions above hold. |
| any time Grady's data is still unverified | Keep it. The sliding-scale branch is honest and demoable. |
