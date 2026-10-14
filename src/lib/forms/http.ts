import { NextResponse } from "next/server";
import { ValidationError, validateInput } from "../engine";
import { getHospital } from "../data";
import { parseInput } from "../parse";
import type { EligibilityInput } from "../types";
import { cleanAnswers, FormValidationError, type CleanAnswers } from "./answers";
import { getForm } from "./definitions";
import { formsApiEnabled } from "./flag";
import type { FormDef } from "./types";

const NOINDEX = { "x-robots-tag": "noindex", "cache-control": "no-store" };

export const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: NOINDEX });

/** Preview-only gate. On Vercel production the routes answer 404 as if they did not exist. */
export function disabledResponse(): Response | null {
  return formsApiEnabled() ? null : json({ error: "Not found" }, 404);
}

export function lookupForm(id: string): FormDef | Response {
  return getForm(id) ?? json({ error: `Unknown hospital form: ${id}` }, 404);
}

export async function readBody(req: Request): Promise<Record<string, unknown> | Response> {
  try {
    const body = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "Body must be a JSON object" }, 400);
    return body as Record<string, unknown>;
  } catch {
    return json({ error: "Body must be JSON" }, 400);
  }
}

/** `input` is optional. When present it is validated like the eligibility API and used to pre-fill state, county and income. */
export function readOptionalInput(body: Record<string, unknown>, formId: string): EligibilityInput | null | Response {
  if (body.input === undefined || body.input === null) return null;
  try {
    const input = parseInput(body.input);
    if (!getHospital(input.hospital_id)) return json({ error: `Unknown hospital: ${input.hospital_id}` }, 404);
    validateInput(input);
    if (input.hospital_id !== formId) return json({ error: `input.hospital_id must be "${formId}" to match this form` }, 400);
    return input;
  } catch (e) {
    if (e instanceof ValidationError) return json({ error: e.message }, 400);
    throw e;
  }
}

export function checkAnswers(form: FormDef, body: Record<string, unknown>, input: EligibilityInput | null, draft: boolean): CleanAnswers | Response {
  try {
    return cleanAnswers(form, body.answers ?? {}, { draft, input });
  } catch (e) {
    if (e instanceof FormValidationError) return json({ error: "Some answers need fixing", problems: e.problems }, 400);
    if (e instanceof ValidationError) return json({ error: e.message }, 400);
    throw e;
  }
}
