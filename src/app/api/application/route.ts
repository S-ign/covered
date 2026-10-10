import { NextResponse } from "next/server";
import { getFplTable, getHospital } from "@/lib/data";
import { computeEligibility, ValidationError } from "@/lib/engine";
import { parseApplicant, parseInput } from "@/lib/parse";
import { renderApplicationPdf } from "@/lib/pdf/generated";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { input?: unknown; applicant?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
  }
  try {
    const input = parseInput(body.input);
    const applicant = parseApplicant(body.applicant);
    const hospital = getHospital(input.hospital_id);
    if (!hospital) {
      return NextResponse.json({ error: `Unknown hospital: ${input.hospital_id}` }, { status: 404 });
    }
    const result = computeEligibility(input, hospital, getFplTable());
    const bytes = await renderApplicationPdf(result, applicant);
    return new Response(Buffer.from(bytes), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="covered-${result.hospital}-application.pdf"`,
      },
    });
  } catch (e) {
    if (e instanceof ValidationError) return NextResponse.json({ error: e.message }, { status: 400 });
    throw e;
  }
}
