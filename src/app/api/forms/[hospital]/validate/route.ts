import { checkAnswers, disabledResponse, json, lookupForm, readBody, readOptionalInput } from "@/lib/forms/http";

export const runtime = "nodejs";
type Ctx = { params: Promise<{ hospital: string }> };

/** POST /api/forms/{hospital}/validate: same body as the fill route, but returns what is missing or wrong instead of a PDF. */
export async function POST(req: Request, { params }: Ctx) {
  const off = disabledResponse();
  if (off) return off;
  const form = lookupForm((await params).hospital);
  if (form instanceof Response) return form;
  const body = await readBody(req);
  if (body instanceof Response) return body;
  const input = readOptionalInput(body, form.id);
  if (input instanceof Response) return input;

  const strict = checkAnswers(form, body, input, false);
  if (!(strict instanceof Response)) return json({ ok: true, missing_required: [], problems: [] });

  // Re-run as a draft: if that passes, the only trouble is missing required fields.
  const draft = checkAnswers(form, body, input, true);
  const detail = (await strict.json()) as { problems?: string[]; error?: string };
  const problems = detail.problems ?? (detail.error ? [detail.error] : []);
  const missing = problems.filter((p) => p.endsWith(": required")).map((p) => p.replace(/: required$/, ""));
  return json({
    ok: false,
    missing_required: missing,
    problems: problems.filter((p) => !p.endsWith(": required")),
    can_download_draft: !(draft instanceof Response),
  }, 200);
}
