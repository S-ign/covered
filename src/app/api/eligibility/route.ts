import { NextResponse } from "next/server";
import { getFplTable, getHospital } from "@/lib/data";
import { computeEligibility, ValidationError } from "@/lib/engine";
import { parseInput } from "@/lib/parse";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
  }
  const input = parseInput(body);
  const hospital = getHospital(input.hospital_id);
  if (!hospital) {
    return NextResponse.json({ error: `Unknown hospital: ${input.hospital_id}` }, { status: 404 });
  }
  try {
    return NextResponse.json(computeEligibility(input, hospital, getFplTable()));
  } catch (e) {
    if (e instanceof ValidationError) return NextResponse.json({ error: e.message }, { status: 400 });
    throw e;
  }
}
