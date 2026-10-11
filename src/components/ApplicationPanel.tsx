"use client";

import { useState } from "react";
import type { Applicant, EligibilityInput, EligibilityResult } from "@/lib/types";
import { ArrowRight, ArrowUpRight, Check, Doc, Download } from "./Icons";

const FIELDS: { key: keyof Applicant; id: string; label: string; type?: string; autoComplete: string; textarea?: boolean }[] = [
  { key: "full_name", id: "full-name", label: "Full name", autoComplete: "name" },
  { key: "date_of_birth", id: "date-of-birth", label: "Date of birth", type: "date", autoComplete: "bday" },
  { key: "phone", id: "phone", label: "Phone", type: "tel", autoComplete: "tel" },
  { key: "mailing_address", id: "mailing-address", label: "Mailing address", autoComplete: "street-address", textarea: true },
];

export function ApplicationPanel({ result, input }: { result: EligibilityResult; input: EligibilityInput }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applicant, setApplicant] = useState<Applicant>({ full_name: "", mailing_address: "", phone: "", date_of_birth: "" });
  const update = (key: keyof Applicant) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setApplicant((current) => ({ ...current, [key]: event.target.value }));

  async function download() {
    setBusy(true);
    setError(null);
    setDone(false);
    try {
      const response = await fetch("/api/application", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ input, applicant }),
      });
      if (!response.ok) throw new Error((await response.json()).error ?? `Request failed (${response.status})`);
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = `covered-${input.hospital_id}-application.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We could not prepare the application.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="block apply" aria-labelledby="apply-title" data-reveal>
      <p className="eyebrow eyebrow-dark"><span className="dot" /> Your next step</p>
      <h2 id="apply-title" className="h2 h2-sm">Prepare your application</h2>

      <div className="apply-grid">
        <div className="apply-card apply-form-card">
          <div className="apply-card-head">
            <span className="apply-icon"><Doc /></span>
            <div>
              <h3>A filled-out application, ready to send</h3>
              <p>We put your details and the figures above onto one clean page. What you type here is only used to make this download.</p>
            </div>
          </div>

          {!open ? (
            <button className="btn btn-lg" type="button" onClick={() => setOpen(true)}>
              Prepare my application <ArrowRight />
            </button>
          ) : (
            <form className="apply-form" onSubmit={(e) => { e.preventDefault(); void download(); }}>
              {FIELDS.map((f) => (
                <div className={`field${f.textarea ? " field-wide" : ""}`} key={f.id}>
                  <label className="label" htmlFor={f.id}>{f.label}</label>
                  {f.textarea ? (
                    <textarea id={f.id} className="control" rows={3} autoComplete={f.autoComplete} value={applicant[f.key]} onChange={update(f.key)} />
                  ) : (
                    <input id={f.id} className="control" type={f.type ?? "text"} autoComplete={f.autoComplete} value={applicant[f.key]} onChange={update(f.key)} />
                  )}
                </div>
              ))}
              <div className="apply-submit field-wide">
                <button className="btn btn-lg" type="submit" disabled={busy}>
                  {busy ? <>Preparing…</> : <><Download /> Download application PDF</>}
                </button>
                {done && <p className="apply-done" role="status"><Check width={16} height={16} /> Downloaded. Check your downloads folder.</p>}
                {error && <p className="field-error" role="alert">{error}</p>}
              </div>
            </form>
          )}
        </div>

        <div className="apply-card apply-docs">
          <h3>Documents to include</h3>
          <ul className="check-list">
            {result.documents_required.map((document) => (
              <li className="check-item" key={document}>
                <span className="check-box" aria-hidden="true" />
                <span>{document}</span>
              </li>
            ))}
          </ul>
          <a className="official-link" href={result.application_url} target="_blank" rel="noreferrer">
            Open {result.hospital_name}&apos;s official application <ArrowUpRight width={16} height={16} />
          </a>
        </div>
      </div>
    </section>
  );
}
