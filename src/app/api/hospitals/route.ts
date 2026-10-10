import { NextResponse } from "next/server";
import { getHospitals } from "@/lib/data";

export function GET() {
  return NextResponse.json({ hospitals: getHospitals() });
}
