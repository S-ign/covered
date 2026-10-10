# Covered: UI Brief for Avery

Paste this whole file into your AI tool at minute zero. It has everything you need. You do not need to wait on Gideon for anything until the 1:05 integration checkpoint.

## What you are building

Generations Covered ("Covered") is a web app that tells a patient what a nonprofit hospital's own financial assistance policy says their bill drops to, then prepares the application. You are building two pages in a Next.js app:

1. `/` an intake form.
2. `/result` a result page that shows the number, how we got there, and a "prepare application" panel.

Gideon is building the engine and the API at the same time. Until 1:05 you work entirely from fixture files that are already in the repo. At 1:05 you swap the fixtures for real fetch calls. The fixtures and the API return the exact same shape, so the swap is small.

## Rules

- **Only edit these paths:** `src/app/page.tsx`, `src/app/result/**`, `src/components/**`, `src/app/layout.tsx`, `src/app/globals.css`.
- **Read but never edit:** `src/lib/types.ts`, `src/lib/fixtures/*.json`, `src/lib/config.ts`.
- **Never edit:** anything else under `src/lib`, `src/app/api`, `data`, `package.json`. If you want a package, ask Gideon in chat first.
- Every component that uses `useState`, `useEffect`, `useRouter`, `useSearchParams`, or an `onClick` must have `"use client";` as its very first line.
- Commit every 15 to 20 minutes. Before every push: `git pull --rebase origin main`, then `git push`.
- Styling is Tailwind. It is already set up. Use utility classes in `className`.
- No new routes beyond `/` and `/result`. No state libraries. No database.

## Setup (minute 0 to 10, while Gideon scaffolds)

Gideon will push the scaffold by 0:10. When they say "pushed":

```bash
git clone <repo-url> covered
cd covered
npm install
npm run dev
```

Open http://localhost:3000. You should see the default Next.js page. Replace it.

## Next.js in five lines

- Files under `src/app/` become URLs. `src/app/page.tsx` is `/`. `src/app/result/page.tsx` is `/result`.
- `src/app/layout.tsx` wraps every page. Put the site header there.
- A `page.tsx` exports a default React component. That is the page.
- Anything interactive needs `"use client";` at the top of its file.
- Read the URL's query string with `useSearchParams()` from `next/navigation`. Navigate with `useRouter().push(url)` from the same import.

## The contract

Read `src/lib/types.ts` in the repo. The two types you consume:

**`EligibilityResult`** is what the result page displays. Key fields:

| Field | Meaning |
|---|---|
| `hospital_name` | "Piedmont Healthcare" |
| `fpl_pct` | whole number, e.g. 143. Show as "143% of the Federal Poverty Level" |
| `status` | `"free"`, `"discounted"`, `"eligible_sliding_scale"`, or `"no_match"` |
| `bill_before` | dollars |
| `bill_after` | dollars, or `null` when the hospital sets the discount or nothing matched |
| `tier_matched` | `{ max_fpl_pct, discount_pct, applies_to, note? }` or `null` |
| `residency_ok` | `false` means show the residency warning |
| `residency` | `{ type: "county", values: ["Fulton","DeKalb"] }`, or type `"state"`, or type `"none"` |
| `policy_conflicts` | array. If non-empty, show the conflict box. Each has `claim`, `note`, `source_url` |
| `documents_required` | string array for the checklist |
| `application_url` | link to the hospital's real application |
| `source_url`, `policy_date` | the policy PDF link and its date |
| `verified` | `false` means show the small "pending verification" text |

**`HospitalPolicy`** fills the hospital dropdown. You need `id` and `name`.

## Fixtures

- `src/lib/fixtures/hospitals.json` has `{ "hospitals": HospitalPolicy[] }`.
- `src/lib/fixtures/results.json` is an object keyed by persona. Use `"maria-piedmont"` as your default while building. Other keys: `maria-emory`, `johnsons-emory`, `johnsons-piedmont`, `darnell-grady`, `darnell-grady-cobb`. Each one exercises a different branch of the result page.

Import them like this:

```ts
import hospitalsFixture from "@/lib/fixtures/hospitals.json";
import resultsFixture from "@/lib/fixtures/results.json";
import type { EligibilityResult, HospitalPolicy } from "@/lib/types";
```

## Step 1: layout and header (0:10 to 0:20)

In `src/app/layout.tsx`, add a simple header with the app name from `src/lib/config.ts` (`APP_NAME`). Set the page `<title>` to the app name. Set a calm neutral background on `<body>` and a max-width centered content column with 16px side padding so it works on a phone.

## Step 2: intake page (0:20 to 0:45)

File: `src/app/page.tsx`. Mark it `"use client";`.

Fields, in this order:

| Label | Input | Query param | Notes |
|---|---|---|---|
| Which hospital sent the bill? | select from `hospitalsFixture.hospitals` (`id` as value, `name` as label) | `hospital` | default `piedmont` |
| How many people live in your household? | number, min 1, max 20 | `size` | default 3 |
| Total household income per year, before taxes | number, min 0 | `income` | show a $ prefix |
| Do you have health insurance? | two radios: "No insurance" = `uninsured`, "I have insurance but can't afford the bill" = `underinsured` | `insurance` | default `uninsured` |
| What county do you live in? | select: Fulton, DeKalb, Cobb, Gwinnett, Clayton, Other | `county` | default Fulton |
| How much is the bill? | number, min 1 | `bill` | show a $ prefix |

Submit button text: "See what the policy says". On submit, build the URL and navigate:

```ts
const params = new URLSearchParams({ hospital, size, income, insurance, county, bill });
router.push(`/result?${params.toString()}`);
```

Validation: block submit if any number is empty or negative. Nothing more.

Below the form, one quiet sentence: "Nonprofit hospitals are required by federal law to offer financial assistance. We read their policies so you don't have to."

Check: filling in the defaults and submitting should land on `/result?hospital=piedmont&size=3&income=38000&insurance=uninsured&county=Fulton&bill=9400` (set income default 38000 and bill default 9400 so the demo is one click).

## Step 3: result page from fixtures (0:45 to 1:05)

File: `src/app/result/page.tsx`. Mark it `"use client";`. Wrap the component that calls `useSearchParams` in `<Suspense>` (Next.js requires this).

For now, ignore the query string and render `resultsFixture["maria-piedmont"]` as `EligibilityResult`. Build these sections as separate components in `src/components/`:

1. **`ResultHeadline`**: the biggest thing on the page.
   - `free`: "Your $9,400 bill drops to $0." with the $0 huge.
   - `discounted`: "Your $9,400 bill drops to $6,110." Also show "{discount_pct}% discount" from `tier_matched`.
   - `eligible_sliding_scale`: "You qualify for assistance. {hospital_name} sets the discount on a sliding scale."
   - `no_match`: "No published tier matches your situation. Call {hospital_name}'s financial counselor."
   Format dollars with `toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })`.
2. **`HowWeGotHere`**: a short list. Household of {size}. Income {income}. That is {fpl_pct}% of the Federal Poverty Level. {hospital_name}'s policy gives a {discount_pct}% discount at or below {max_fpl_pct}% (or the tier note if `discount_pct` is null). Last line: "Source: {hospital_name} financial assistance policy, {policy_date}" where the policy name is a link to `source_url`, underlined, opens in a new tab.
3. **`ResidencyWarning`**: only when `residency_ok` is false. "{hospital_name}'s policy covers {values joined with ' and '} residents. You entered {county}. Call them to ask about exceptions." Amber background.
4. **`PolicyConflictNote`**: only when `policy_conflicts.length > 0`. For each: the `claim` in bold, the `note` below, a link to `source_url`. Highlighted border. Heading: "The hospital's own documents disagree".
5. **`VerificationFlag`**: only when `verified` is false. Small gray text: "Figures pending verification against the policy PDF."
6. **`SourcesFooter`**: every hospital in `hospitalsFixture.hospitals` as "{name}: policy" linked to its `policy_url`.

Test each branch by changing the fixture key: `johnsons-emory` for discounted plus conflict, `darnell-grady` for sliding scale, `darnell-grady-cobb` for the residency warning.

## Step 4: integration checkpoint (1:05 to 1:15)

Gideon says "API is up". Make two changes.

**Intake page**: replace the hospitals fixture with a fetch in a `useEffect`:

```ts
const [hospitals, setHospitals] = useState<HospitalPolicy[]>([]);
useEffect(() => {
  fetch("/api/hospitals").then(r => r.json()).then(d => setHospitals(d.hospitals));
}, []);
```

**Result page**: read the query string, POST it, render the response:

```ts
const sp = useSearchParams();
const [result, setResult] = useState<EligibilityResult | null>(null);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const body = {
    hospital_id: sp.get("hospital"),
    household_size: Number(sp.get("size")),
    annual_income: Number(sp.get("income")),
    bill_amount: Number(sp.get("bill")),
    insurance_status: sp.get("insurance"),
    county: sp.get("county"),
    state: "GA",
  };
  fetch("/api/eligibility", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
    .then(async r => { if (!r.ok) throw new Error((await r.json()).error); return r.json(); })
    .then(setResult)
    .catch(e => setError(e.message));
}, [sp]);
```

While `result` is null and `error` is null, show "Checking {hospital}'s policy...". If `error`, show it with a link back to `/`.

Run Maria end to end with Gideon: hospital Piedmont, 3 people, $38,000, no insurance, Fulton, $9,400. The page must say $0.

## Step 5: switcher and application panel (1:15 to 1:40)

**`HospitalSwitcher`** component, placed under the headline: a select of hospitals. On change, copy the current query params, set `hospital` to the new id, and `router.push` the new URL. The page refetches because `sp` changed. Label: "What if the bill were from a different hospital?"

**`ApplicationPanel`** component, at the bottom above the footer:

- A button "Prepare my application". Clicking reveals four inputs: Full name, Mailing address (textarea), Phone, Date of birth (type date).
- A button "Download application PDF". On click:

```ts
const res = await fetch("/api/application", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ input: body, applicant }),   // `body` is the same EligibilityInput you POSTed
});
const blob = await res.blob();
const url = URL.createObjectURL(blob);
const a = document.createElement("a");
a.href = url;
a.download = `covered-${body.hospital_id}-application.pdf`;
a.click();
URL.revokeObjectURL(url);
```

- Under the buttons, always visible: "Documents to include" as a checklist of `documents_required`, and a link "Open {hospital_name}'s official application" to `application_url`.

If Gideon says the PDF route is cut, hide the download button and keep the checklist and link. That is the planned fallback.

## Step 6: polish (1:40 to 1:50)

- Open the site at phone width. Nothing should scroll sideways.
- The $0 should be the largest text on the page by far.
- Every link to a policy is underlined.
- Buttons use the one accent color. Nothing else does.

Freeze at 1:50. No new features after that.

## Design direction

Warm and plain, not clinical. One typeface (the default system font stack is fine). A calm neutral background and one accent color used only for the headline number and primary buttons. Lots of whitespace. No cards for the sake of cards, no icons, no gradients. The page should feel like a trustworthy letter, not a dashboard. Policy links are visible and underlined because they are the trust signal of the whole product.

## If something breaks

- "useSearchParams() should be wrapped in a suspense boundary": wrap the component in `<Suspense fallback={null}>` in `page.tsx`.
- "You're importing a component that needs useState": add `"use client";` as the first line of that file.
- A fetch returns 404 or HTML: Gideon's route isn't up yet. Go back to the fixture and tell them.
- Merge conflict on `git pull --rebase`: it will be in a file you both touched. Only `layout.tsx` is plausible. Keep your version, tell Gideon.
