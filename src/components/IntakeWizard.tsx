"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { HospitalPolicy, InsuranceStatus } from "@/lib/types";
import { usd } from "./format";
import { ArrowLeft, ArrowRight, Minus, Plus, Pin, Person, Shield } from "./Icons";

const COUNTIES = ["Fulton", "DeKalb", "Cobb", "Gwinnett", "Clayton", "Other"];
const STEPS = ["The bill", "Your household", "Coverage & county"];

function Money({ id, label, help, value, onChange }: { id: string; label: string; help?: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="field">
      <label className="label" htmlFor={id}>{label}</label>
      {help && <p className="help" id={`${id}-help`}>{help}</p>}
      <div className="money">
        <span aria-hidden="true">$</span>
        <input id={id} inputMode="decimal" type="number" min="0" step="1" value={value} aria-describedby={help ? `${id}-help` : undefined} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}

export function IntakeWizard() {
  const router = useRouter();
  const [hospitals, setHospitals] = useState<HospitalPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [hospital, setHospital] = useState("piedmont");
  const [bill, setBill] = useState("9400");
  const [size, setSize] = useState(3);
  const [income, setIncome] = useState("38000");
  const [insurance, setInsurance] = useState<InsuranceStatus>("uninsured");
  const [county, setCounty] = useState("Fulton");
  const [touched, setTouched] = useState(false);
  const top = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/hospitals").then((r) => r.json()).then((d) => setHospitals(d.hospitals ?? [])).catch(() => setHospitals([])).finally(() => setLoading(false));
  }, []);

  const hospitalName = hospitals.find((h) => h.id === hospital)?.name ?? "your hospital";
  const billN = Number(bill);
  const incomeN = Number(income);
  const stepValid = [
    Boolean(hospital) && bill !== "" && billN > 0,
    income !== "" && incomeN >= 0 && size >= 1 && size <= 20,
    true,
  ];
  const allValid = stepValid.every(Boolean);
  const errors = useMemo(() => [
    bill === "" || billN <= 0 ? "Enter the amount on the bill, more than $0." : "",
    income === "" || incomeN < 0 ? "Enter your yearly household income. Use 0 if you have none." : "",
    "",
  ], [bill, billN, income, incomeN]);

  function go(next: number) {
    setTouched(false);
    setStep(next);
    top.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  }
  function next() {
    if (!stepValid[step]) { setTouched(true); return; }
    go(step + 1);
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (step < 2) return next();
    if (!allValid) { setTouched(true); return; }
    router.push(`/result?${new URLSearchParams({ hospital, size: String(size), income, insurance, county, bill }).toString()}`);
  }

  const pct = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="intake">
      <div className="shell intake-grid">
        <div className="intake-main" ref={top}>
          <p className="eyebrow eyebrow-dark"><span className="dot" /> Step {step + 1} of {STEPS.length} · {STEPS[step]}</p>
          <div className="progress" role="progressbar" aria-valuemin={1} aria-valuemax={3} aria-valuenow={step + 1} aria-label="Progress">
            <span style={{ width: `${pct}%` }} />
          </div>

          <form onSubmit={submit} noValidate>
            <div className="panel" key={step}>
              {step === 0 && (
                <>
                  <h1 className="h1">Where did the bill come from?</h1>
                  <p className="sub">We&apos;ll compare your situation with that hospital&apos;s published financial assistance policy.</p>
                  <div className="field">
                    <label className="label" htmlFor="hospital">Hospital</label>
                    <div className="select-wrap">
                      <select id="hospital" value={hospital} disabled={loading || hospitals.length === 0} onChange={(e) => setHospital(e.target.value)}>
                        {hospitals.length === 0 && <option value="">Loading hospitals…</option>}
                        {hospitals.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <Money id="bill" label="How much is the bill?" value={bill} onChange={setBill} />
                  {touched && errors[0] && <p className="field-error" role="alert">{errors[0]}</p>}
                </>
              )}

              {step === 1 && (
                <>
                  <h1 className="h1">A little about your household.</h1>
                  <p className="sub">Assistance is based on income compared with the size of your household.</p>
                  <div className="field">
                    <span className="label" id="size-label">People in your household</span>
                    <p className="help">Include yourself and anyone whose income is counted with yours.</p>
                    <div className="stepper" role="group" aria-labelledby="size-label">
                      <button type="button" className="step-btn" aria-label="Remove one person" disabled={size <= 1} onClick={() => setSize((s) => Math.max(1, s - 1))}><Minus /></button>
                      <div className="stepper-value" aria-live="polite">
                        <strong>{size}</strong>
                        <span className="people" aria-hidden="true">
                          {Array.from({ length: Math.min(size, 8) }, (_, i) => <Person key={i} />)}
                          {size > 8 && <b>+{size - 8}</b>}
                        </span>
                      </div>
                      <button type="button" className="step-btn" aria-label="Add one person" disabled={size >= 20} onClick={() => setSize((s) => Math.min(20, s + 1))}><Plus /></button>
                    </div>
                  </div>
                  <Money id="income" label="Total yearly household income, before taxes" help="Wages, benefits and other income for everyone counted above." value={income} onChange={setIncome} />
                  {touched && errors[1] && <p className="field-error" role="alert">{errors[1]}</p>}
                </>
              )}

              {step === 2 && (
                <>
                  <h1 className="h1">Last details.</h1>
                  <p className="sub">Some policies depend on whether you&apos;re insured and where you live.</p>
                  <fieldset className="field">
                    <legend className="label">Do you have health insurance?</legend>
                    <div className="choices">
                      {([
                        ["uninsured", "No insurance", "I pay the full bill myself."],
                        ["underinsured", "Insured, but I can't afford this bill", "My plan doesn't cover enough."],
                      ] as const).map(([val, title, note]) => (
                        <label key={val} className={`choice${insurance === val ? " is-on" : ""}`}>
                          <input type="radio" name="insurance" checked={insurance === val} onChange={() => setInsurance(val)} />
                          <span className="choice-dot" aria-hidden="true" />
                          <span><strong>{title}</strong><small>{note}</small></span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <div className="field">
                    <span className="label" id="county-label">County where you live</span>
                    <div className="chips" role="radiogroup" aria-labelledby="county-label">
                      {COUNTIES.map((c) => (
                        <button key={c} type="button" role="radio" aria-checked={county === c} className={`chip${county === c ? " is-on" : ""}`} onClick={() => setCounty(c)}>{c}</button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="wizard-actions">
              {step > 0 ? (
                <button type="button" className="btn-text" onClick={() => go(step - 1)}><ArrowLeft width={18} height={18} /> Back</button>
              ) : <span />}
              {step < 2 ? (
                <button type="submit" className="btn btn-lg">Continue <ArrowRight /></button>
              ) : (
                <button type="submit" className="btn btn-lg" disabled={!allValid || loading}>See what the policy says <ArrowRight /></button>
              )}
            </div>
          </form>

          <p className="intake-note"><Shield width={16} height={16} /> Nonprofit hospitals are required by federal law to offer financial assistance. We read their policies so you don&apos;t have to.</p>
        </div>

        <aside className="summary" aria-label="Your details so far">
          <div className="receipt">
            <p className="receipt-kicker">Your details</p>
            <div className="receipt-amount">{billN > 0 ? usd(billN) : "$—"}</div>
            <p className="receipt-hospital">{hospitalName}</p>
            <dl>
              <div><dt>Household</dt><dd>{size} {size === 1 ? "person" : "people"}</dd></div>
              <div><dt>Yearly income</dt><dd>{income !== "" && incomeN >= 0 ? usd(incomeN) : "—"}</dd></div>
              <div><dt>Insurance</dt><dd>{insurance === "uninsured" ? "None" : "Can't afford bill"}</dd></div>
              <div><dt>County</dt><dd><Pin width={14} height={14} /> {county}</dd></div>
            </dl>
            <p className="receipt-foot">Estimated against the hospital&apos;s own published policy.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
