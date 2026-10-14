import { readFileSync } from "node:fs";
import path from "node:path";
import { PDFCheckBox, PDFDocument, PDFRadioGroup, PDFTextField, StandardFonts, rgb } from "pdf-lib";
import type { CleanAnswers } from "./answers";
import type { FormDef } from "./types";

export function templatePath(form: FormDef): string {
  return path.join(process.cwd(), "data", "forms", form.file);
}

export interface FillOptions {
  /** Burn the answers into the page so the PDF is no longer editable. Default: leave it fillable so the applicant can check it and sign. */
  flatten?: boolean;
}

/**
 * Write the cleaned answers into the hospital's own fillable PDF using its real AcroForm field names.
 * Signature, witness, date-of-signature and office-use fields are never touched.
 */
export async function fillForm(form: FormDef, answers: CleanAnswers, options: FillOptions = {}): Promise<Uint8Array> {
  const doc = await PDFDocument.load(readFileSync(templatePath(form)));
  const pdf = doc.getForm();
  const pages = doc.getPages();
  const helv = await doc.embedFont(StandardFonts.Helvetica);

  const setText = (name: string, value: string, multiline = false) => {
    const field = pdf.getTextField(name);
    if (multiline) field.enableMultiline();
    field.setText(value);
  };

  // Detach shared-name widgets first (Grady reuses CITY/STATE/ZIP for the emergency contact on page 2),
  // so filling the patient's value cannot also print it there.
  const detached = new Map<string, { page: number; x: number; y: number; width: number; height: number }>();
  for (const f of form.fields) {
    for (const fill of f.fill) {
      if (fill.kind !== "widget") continue;
      const field = pdf.getTextField(fill.pdf);
      const widgets = field.acroField.getWidgets();
      const idx = widgets.findIndex((w) => pages.findIndex((p) => p.ref === w.P()) === fill.page);
      if (idx < 0) throw new Error(`${form.id}: ${fill.pdf} has no widget on page ${fill.page + 1}`);
      const rect = widgets[idx].getRectangle();
      const ref = field.acroField.Kids()?.get(idx);
      if (ref) pages[fill.page].node.removeAnnot(ref as never);
      field.acroField.removeWidget(idx);
      detached.set(f.key, { page: fill.page, ...rect });
    }
  }

  for (const f of form.fields) {
    const value = answers.values[f.key];
    const multi = answers.multi[f.key];
    for (const fill of f.fill) {
      if (fill.kind === "text") {
        if (value) setText(fill.pdf, value, f.type === "multiline");
      } else if (fill.kind === "radio") {
        if (value) pdf.getRadioGroup(fill.pdf).select(value === "yes" ? fill.yes : fill.no);
      } else if (fill.kind === "checks") {
        if (value === "yes" && fill.yes) pdf.getCheckBox(fill.yes).check();
        if (value === "no" && fill.no) pdf.getCheckBox(fill.no).check();
      } else if (fill.kind === "options") {
        for (const chosen of multi ?? (value ? [value] : [])) {
          const name = fill.pdf[chosen];
          if (name) pdf.getCheckBox(name).check();
        }
      } else if (fill.kind === "widget") {
        const rect = detached.get(f.key);
        if (value && rect) {
          const size = Math.min(10, rect.height - 6);
          pages[rect.page].drawText(value, { x: rect.x + 3, y: rect.y + (rect.height - size) / 2 + 1, size, font: helv, color: rgb(0, 0, 0), maxWidth: rect.width - 6 });
        }
      }
    }
  }

  for (const l of form.lists) {
    const rows = answers.lists[l.key] ?? [];
    rows.forEach((row, i) => {
      for (const c of l.columns) if (row[c.key]) setText(l.pdf[c.key][i], row[c.key]);
    });
  }

  if (options.flatten) pdf.flatten();
  doc.setTitle(form.title);
  doc.setProducer("Generations Covered");
  doc.setCreator("Generations Covered");
  return doc.save();
}

/** Every AcroForm field name in a template, with its kind. Used by the tests and `npm run pdf:fields`. */
export async function listPdfFields(file: string): Promise<{ name: string; kind: "text" | "check" | "radio" | "other"; options?: string[] }[]> {
  const doc = await PDFDocument.load(readFileSync(file));
  return doc.getForm().getFields().map((f) => ({
    name: f.getName(),
    kind: f instanceof PDFTextField ? "text" : f instanceof PDFCheckBox ? "check" : f instanceof PDFRadioGroup ? "radio" : "other",
    options: f instanceof PDFRadioGroup ? f.getOptions() : undefined,
  }));
}
