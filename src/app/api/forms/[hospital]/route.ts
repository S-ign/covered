import { fillForm } from "@/lib/forms/fill";
import { checkAnswers, disabledResponse, json, lookupForm, readBody, readOptionalInput } from "@/lib/forms/http";
import type { FormDef } from "@/lib/forms/types";

export const runtime = "nodejs";
const omit = <T extends object, K extends keyof T>(o: T, key: K): Omit<T, K> => {
  const { [key]: _dropped, ...rest } = o;
  void _dropped;
  return rest;
};
type Ctx = { params: Promise<{ hospital: string }> };

/** The questions on this hospital's form: sections, fields, types, options and which are required. */
function describe(form: FormDef) {
  return {
    hospital_id: form.id,
    title: form.title,
    preview: true,
    sections: form.sections,
    fields: form.fields.map((f) => omit(f, "fill")),
    lists: form.lists.map((l) => omit(l, "pdf")),
    never_filled: "Signatures, witness lines, signature dates and office-use boxes are left blank for the applicant and the hospital.",
  };
}

export async function GET(_req: Request, { params }: Ctx) {
  const off = disabledResponse();
  if (off) return off;
  const form = lookupForm((await params).hospital);
  if (form instanceof Response) return form;
  return json(describe(form));
}

/**
 * POST /api/forms/{hospital}
 * Body: { answers: {...}, input?: {...eligibility input}, draft?: boolean, flatten?: boolean }
 * Returns the hospital's own application PDF with the answers filled in. `draft` skips the required-field check.
 * `flatten` makes the result non-editable. The default stays fillable so the applicant can review and sign.
 */
export async function POST(req: Request, { params }: Ctx) {
  const off = disabledResponse();
  if (off) return off;
  const form = lookupForm((await params).hospital);
  if (form instanceof Response) return form;
  const body = await readBody(req);
  if (body instanceof Response) return body;
  const input = readOptionalInput(body, form.id);
  if (input instanceof Response) return input;
  const answers = checkAnswers(form, body, input, body.draft === true);
  if (answers instanceof Response) return answers;

  const bytes = await fillForm(form, answers, { flatten: body.flatten === true });
  return new Response(Buffer.from(bytes), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="covered-${form.id}-application.pdf"`,
      "x-robots-tag": "noindex",
      "cache-control": "no-store",
    },
  });
}
