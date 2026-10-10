"use client";

import { useState } from "react";
import type { Applicant, EligibilityInput, EligibilityResult } from "@/lib/types";

export function ApplicationPanel({ result, input }: { result: EligibilityResult; input: EligibilityInput }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applicant, setApplicant] = useState<Applicant>({ full_name: "", mailing_address: "", phone: "", date_of_birth: "" });
  const update = (key: keyof Applicant) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setApplicant((current) => ({ ...current, [key]: event.target.value }));
  async function download() {
    setBusy(true); setError(null);
    try {
      const response = await fetch("/api/application", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ input, applicant }) });
      if (!response.ok) throw new Error((await response.json()).error ?? `Request failed (${response.status})`);
      const url = URL.createObjectURL(await response.blob()); const link = document.createElement("a"); link.href = url; link.download = `covered-${input.hospital_id}-application.pdf`; link.click(); URL.revokeObjectURL(url);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "We could not prepare the application."); } finally { setBusy(false); }
  }
  return <section className="result-section apply-panel"><div><h2>Prepare an application</h2><p className="apply-intro">Use the hospital&apos;s form and checklist to take the next step. Your information is only used to prepare this download.</p></div>{!open && <button className="primary-button" type="button" onClick={() => setOpen(true)}>Prepare my application</button>}{open && <div className="form-layout" style={{ marginTop: 0, gap: 18 }}><div className="field-group"><label className="field-label" htmlFor="full-name">Full name</label><input id="full-name" className="field-control" value={applicant.full_name} onChange={update("full_name")} /></div><div className="field-group"><label className="field-label" htmlFor="mailing-address">Mailing address</label><textarea id="mailing-address" className="field-control" rows={3} value={applicant.mailing_address} onChange={update("mailing_address")} /></div><div className="field-group"><label className="field-label" htmlFor="phone">Phone</label><input id="phone" className="field-control" type="tel" value={applicant.phone} onChange={update("phone")} /></div><div className="field-group"><label className="field-label" htmlFor="date-of-birth">Date of birth</label><input id="date-of-birth" className="field-control" type="date" value={applicant.date_of_birth} onChange={update("date_of_birth")} /></div><button className="primary-button" type="button" disabled={busy} onClick={download}>{busy ? "Preparing…" : "Download application PDF"}</button>{error && <p className="error-text" role="alert">{error}</p>}</div>}<div className="result-section"><h2>Documents to include</h2><ul className="check-list">{result.documents_required.map((document) => <li className="check-item" key={document}><span className="check-box" aria-hidden="true" />{document}</li>)}</ul><p><a href={result.application_url} target="_blank" rel="noreferrer">Open {result.hospital_name}&apos;s official application</a></p></div></section>;
}