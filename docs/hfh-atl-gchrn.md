# Hack for Humanity Fall 2026: Team Proposal

Oct 8, 2026 · @Dave Carty

## The problem

Nonprofit hospitals are required by federal law (IRS section 501(r)) to publish a financial assistance policy, screen patients for eligibility before aggressive collection, and never charge eligible patients more than they bill insured patients. Most patients never hear about it. The policies are buried in PDFs, the applications are hard to find, and the income thresholds are expressed as percentages of the Federal Poverty Level, which nobody can compute in their head.

The result: people who qualify for free or discounted care pay in full, set up payment plans they cannot afford, or go to collections on bills the hospital was obligated to reduce.

Three facts carry the pitch, each sourced to the hospital's own document:

- Piedmont gives a 100 percent discount to uninsured patients at or below 300 percent of FPL. For a family of three in 2026 that is roughly $80,000 a year.
- Grady covers Fulton and DeKalb residents up to 400 percent of FPL.
- Emory's official policy PDF says free care at 225 percent of FPL for the uninsured. Emory's public web page says 350 percent. The hospital's own documents disagree, and a patient has no way to know which one applies. That discrepancy is the closing slide.

## What we are building

A web app that takes a patient's hospital, household size, income, and bill amount, and produces a completed financial assistance application ready to mail, plus the document checklist and the number the bill drops to.

The wedge is the application, not the eligibility check. A company called CareRoute already runs a free Atlanta charity-care checker that ranks Grady, Emory, and Piedmont by generosity. Their checker tells you that you qualify and then asks you to hire them. Ours produces the thing you would mail. A judge who googles the space finds CareRoute in one click, so we never pitch ourselves as a checker.

Three design rules, enforced in code rather than by discipline:

1. Eligibility is computed from a data file of each hospital's published tiers. No language model touches the eligibility logic. We say this out loud in the pitch.
2. Every number on screen traces to a hospital's own policy PDF, linked.
3. Adding a hospital is adding one entry to the data file. That is the scaling slide: one Atlanta community served today, any nonprofit hospital in the country by config.

Out of scope on event day: bill photo upload, Spanish, more than one hospital's application PDF, bill error detection, anything with an account or a database.

## Hospital data

All figures from each system's published policy. The data owner verifies every row against the PDF before the weekend and records the policy date.

| Hospital | Free care threshold (% FPL) | Partial discount | Residency rule | Source |
| --- | --- | --- | --- | --- |
| Grady Health System | Up to 400% FPL eligible for assistance; tier for 100% discount to confirm from PDF | Sliding scale by FPL tier | Fulton or DeKalb County residents only | [Grady FAP, March 2026](https://www.gradyhealth.org/wp-content/uploads/HB-321-2L-Grady-FAP-Policy-1_Approved-March-20-2026.pdf) |
| Emory Healthcare | 225% FPL uninsured, 125% FPL underinsured (policy PDF) | 35% uninsured discount above 225% with a payment plan; catastrophic assistance above the lines | None stated | [Emory FAP PDF](https://www.emoryhealthcare.org/-/media/Project/EH/Emory/ui/insurance/ehc-financial-assistance-policy.pdf), [Emory web page](https://www.emoryhealthcare.org/patients-visitors/insurance-billing/financial-assistance) |
| Piedmont Healthcare | 300% FPL, 100% discount, uninsured | To confirm from PDF | Georgia residents | [Piedmont FAP](https://Piedmont.org/media/file/Financial-Assistance-Policy.pdf) |

Open items for the data owner:

- [ ] Pull Grady's actual discount tiers between 0 and 400% FPL from the PDF. The policy says up to 400% is eligible for assistance, not that it is free.
- [ ] Resolve the Emory 225% versus 350% conflict. Call Emory Financial Services at 404-778-7318 if the documents do not settle it. Either answer is a slide.
- [ ] Pull Piedmont's partial-discount tiers, if any, above 300%.
- [ ] Look up Georgia HB 321. The Grady policy filename references it. If it is a 2026 state hospital-billing law, it belongs in the pitch.
- [ ] Download each hospital's application PDF and list its form fields.
- [ ] Pull the 2026 Federal Poverty Guidelines table by household size from HHS.

## Event format and rules

The event runs 4:30 to 8:30 pm. The build block is 2.5 hours, not four.

| Block | Length | What it means for us |
| --- | --- | --- |
| Networking | 30 min | Team is already formed. Use it to find out who else is building what. |
| Problem briefing | 15 min | Organizers present suggested problems. Confirmed with the organizer: teams may bring their own concept. We are not bound by the briefing. |
| Hack | 2.5 hours | All code is written here. Nothing arrives pre-built. |
| Demos and judging | 45 min | Shared across all teams. Plan on two and a half minutes per team including setup. |

Rules confirmed with the organizer:

- Teams can form and discuss the project before the event.
- Code must be written during the 2.5-hour block.
- Judged on human or community impact. An idea that works for one Atlanta community and can scale elsewhere scores on both.

Still to confirm: whether slides can be built before the event. Assume yes until told otherwise, but ask.

## Team roles

Three roles, not two. The third one is the one that makes the other two work.

| Role | Owns | Before the event | During the build |
| --- | --- | --- | --- |
| App team | The working app | Reads the spec, picks the stack, sets up accounts and deploy target | Builds from the spec starting at minute zero |
| Deck team | The pitch and slides | Writes the pitch script, builds the animated title and closing slides, rehearses to a timer | Drops final screenshots in, runs the clock during demo practice |
| Data and demo | Inputs both teams depend on | Verifies hospital tiers against the PDFs, builds the FPL table, maps application PDF fields, writes the three personas | Types the data into JSON on the clock, runs the demo end to end three times, records the backup |

Without the third role, the app team spends their first hour reading hospital policies and the deck team invents numbers that do not match the app.

Names go here once the team confirms:

| Role | Member |
| --- | --- |
| App team |  |
| Deck team |  |
| Data and demo |  |

## Pre-event prep

Code is the only thing we cannot bring. Everything that produces code fast is fair game, and that is where we win.

- [ ] **The spec.** One document written as a Claude Code brief: the hospital policy schema, the eligibility result schema, the three hospitals' tiers, the persona inputs with expected outputs, the result page layout, the cut list in order. On event day the app team pastes it in at minute zero. Owner: app team lead, reviewed by all.
- [ ] **The data, as reference not files.** Tier tables, FPL numbers, and PDF field names live in a sheet or doc. Typing them into JSON on the clock takes five minutes and leaves no provenance argument at judging. Owner: data and demo.
- [ ] **The pitch, fully written.** Demo numbers baked in, Emory discrepancy as the closer. Owner: deck team.
- [ ] **Title and closing slides.** Pending the organizer's answer on pre-built slides. Owner: deck team.
- [ ] **Accounts and tooling.** Deploy target created, Claude Code configured on the build machine, PDF library chosen (pdf-lib or PyPDF, decide now), one hospital's application PDF tested for fillable fields. Owner: app team.
- [ ] **Previous gallery check.** Search the prior Hack for Humanity submissions for anything in hospital billing or charity care. Owner: Dave.
- [ ] **Name and one-sentence pitch** settled before the weekend so nobody invents them under the clock. Owner: all, decide in the review of this doc.

Two schemas to fix before anything else, because both teams build against them:

```json
// hospital_policy
{
  "id": "piedmont",
  "name": "Piedmont Healthcare",
  "policy_url": "https://...",
  "policy_date": "2024-05",
  "residency": ["GA"],
  "tiers": [
    {"max_fpl_pct": 300, "discount_pct": 100, "applies_to": "uninsured"}
  ],
  "application_pdf": "piedmont_fap.pdf",
  "documents_required": ["last federal tax return", "two recent pay stubs"]
}

// eligibility_result
{
  "hospital": "piedmont",
  "household_size": 3,
  "annual_income": 38000,
  "fpl_pct": 143,
  "tier_matched": {"max_fpl_pct": 300, "discount_pct": 100},
  "bill_before": 9400,
  "bill_after": 0,
  "documents_required": ["..."],
  "source_url": "https://..."
}
```

## Weekend rehearsal

The rehearsal is a dress rehearsal, not a build day. Its output is a corrected spec, not code.

1. Same clock as the event: 2.5 hours flat, hard stop, timer visible.
2. Pitch delivered at the buzzer to someone who has not seen the project. Record it.
3. Debrief for 20 minutes: where did the hour go, what got cut, what broke, what the pitch audience did not understand.
4. Fix the spec. Every correction from the debrief goes into the brief the app team will paste in on event day.
5. Delete the repo. Nothing from the rehearsal ships. What survives is the spec and the muscle memory.

What we are testing:

- Does the eligibility engine work by minute 75? If not, the spec is wrong, not the team.
- Does one application PDF fill correctly by minute 120? If not, the PDF is the first cut on event day.
- Does the pitch fit in two and a half minutes with the app on screen for ninety seconds of it?
- Does the cold audience understand the problem in twenty seconds?

## Event day build plan

The whole product is the eligibility engine and the result page. Everything after minute 75 is bonus.

| Clock | App team | Data and demo | Deck team |
| --- | --- | --- | --- |
| 0:00 | Screenshot the empty directory, timestamped. Paste the spec into Claude Code. | Type hospital tiers and FPL table into JSON | Open the slide deck, start the problem slide |
| 0:15 | Intake form renders: hospital, household size, income, bill amount | Load three personas | Problem slide done |
| 0:15 to 1:15 | Eligibility engine against the JSON. Result page shows FPL percent, tier matched, bill before and after, source link. | Test every persona against every hospital, log mismatches | Scaling slide, Emory discrepancy slide |
| 1:15 to 2:00 | One hospital's application PDF pre-filled from the result. One only. | Document checklist per hospital. Deploy check. | Placeholder screenshots in |
| 2:00 | Hard freeze. No new features. | Run the demo end to end three times. Record the third. | Final screenshots in, rehearse pitch to the timer |
| 2:30 | Done. | Backup recording on a second device. | Pitch ready |

Cut list, in order. The first item goes first if the clock slips.

1. Application PDF pre-fill. Replace with the document checklist and a link to the application.
2. Source links on the result page. Replace with a Sources footer.
3. Third hospital. Demo with two.

Never attempted on event day: bill photo upload, Spanish, accounts, database, bill error detection.

Stack decision for the app team to confirm: single-page HTML plus a small Python or Node service for the PDF fill, or pure client-side with pdf-lib. Pure client-side has no deploy risk and is the default unless the rehearsal shows pdf-lib fighting the hospital's form.

## Demo and pitch

Two minutes thirty, app on screen for ninety seconds of it. Timer visible to the presenter.

| Seconds | Beat | On screen |
| --- | --- | --- |
| 0 to 20 | The problem. Federal law requires nonprofit hospitals to offer free or discounted care. Most patients never hear about it. | Problem slide |
| 20 to 35 | The persona. A family of three in Atlanta, $38,000 a year, a $9,400 bill from Piedmont. | App, intake form |
| 35 to 70 | Enter it live. The bill drops to zero. Show the source link to Piedmont's own policy. | App, result page |
| 70 to 95 | Click once. The completed application appears, ready to mail, with the document checklist. | App, PDF |
| 95 to 115 | Switch the hospital dropdown to Emory. Different answer, same engine. Show the JSON file. Every new hospital is one entry. | App, then scaling slide |
| 115 to 140 | The closer. Emory's policy PDF says 225 percent. Emory's website says 350 percent. The hospital's own documents disagree. That is why nobody applies. | Emory discrepancy slide |
| 140 to 150 | Name, team, thank you. | Title slide |

The one number: $9,400 to $0. Everything else supports that moment.

If the live demo fails, the presenter says "let me show you the recording" and plays the backup without comment. No apology, no explanation.

## Roadmap

The spec is the critical path. Every pre-event task exists to make the spec right, the rehearsal exists to break it, and event day runs the corrected version with no decisions left to make.

&#91;embedded content: roadmap · 3 lanes, 1 gate, 2 milestones\]

Arrows are hard dependencies: a box cannot be finished until the box feeding it is. The schemas come first because the data owner shapes the tiers to them and the deck team draws the result page from them. Nothing starts until Gate 0, the review of this doc, settles roles and the name.

### Task list

Each task names what it needs and what it hands off. A task with a dependency does not start until that dependency's output exists in the shared folder.

| # | Task | Owner | Needs | Produces | Done when |
| --- | --- | --- | --- | --- | --- |
| 0 | Review this doc, assign roles, pick the name, confirm stack and slide rule | All | Nothing | Gate 0 | Every open question has an answer |
| 1 | Write the two JSON schemas | App | Gate 0 | `hospital_policy` and `eligibility_result` schemas | Both teams have read them and raised no objection |
| 2 | Set up deploy target, Claude Code on the build machine, PDF library test on one hospital form | App | Gate 0 | Working tooling | A hello-world deploys and one PDF field fills |
| 3 | Verify Grady, Emory, Piedmont tiers against the policy PDFs; resolve the Emory conflict; pull 2026 FPL table | Data | Task 1 (shape the data to the schema) | Tier sheet with source link and policy date per row | Every row traces to a PDF page |
| 4 | Map each hospital's application PDF fields; write 3 personas with expected outputs | Data | Task 3 | Field map, persona sheet | A persona run by hand matches the expected output |
| 5 | Ask organizer whether slides can be built before the event | Deck | Gate 0 | Yes or no | Answer in writing |
| 6 | Write the pitch script to 150 seconds | Deck | Task 1 (result page shape), Task 4 (persona numbers) | Script with timings | Read aloud under 150 s with the app beats marked |
| 7 | Write the spec as a Claude Code brief | App | Tasks 1, 2, 3, 4 | Spec v1 | A teammate who did not write it can explain the build order from it |
| 8 | Build title and closing slides | Deck | Task 5 (if yes), Task 6 | Slide shell | Opens on the demo machine |
| 9 | Rehearsal: 2.5 h build, cold pitch, debrief, delete repo | All | Tasks 6, 7, 8 | Spec v2, pitch v2, cut-list order confirmed | Repo deleted, spec updated same day |
| 10 | Event day build from spec v2 | App | Task 9 | The app | Freeze at 2:00 with the demo persona working |
| 11 | Type tiers and FPL into JSON on the clock; run demo three times; record backup | Data | Task 10 (for the demo runs) | Backup recording on a second device | Third run clean |
| 12 | Final screenshots into the deck; rehearse to the timer | Deck | Task 10 | Final deck | Under 150 s on the event machine |
| 13 | Pitch | All | Tasks 10, 11, 12 |  | Delivered |

The two tasks most likely to slip are 3 and 7. Task 3 because the Emory conflict may need a phone call, and Task 7 because it cannot start until everything else is done. If Task 3 is not finished by the day before the rehearsal, the rehearsal uses the Emory PDF numbers and notes the conflict as an open item.

## Open questions for the team

Reply in comments on this doc or bring answers to the weekend.

- [ ] Who takes each of the three roles?
- [ ] Name for the app. Working options: FairBill, CareShield, Covered. Pick one or propose better.
- [ ] Which day and time for the rehearsal, and who is the cold audience for the pitch?
- [ ] App team: client-side only, or a small backend for the PDF fill?
- [ ] Deck team: is the animated presentation realistic in the time budget, or does it become a title and a closer?
- [ ] Is anyone uncomfortable with the hospital billing topic? Say so now, not Saturday.
- [ ] Does anyone know someone at Grady, Emory, or Piedmont financial services who could sanity-check the tiers? A quote from a financial counselor would be a strong slide.
