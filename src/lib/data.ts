import hospitalsJson from "../../data/hospitals.json";
import fplJson from "../../data/fpl-2026.json";
import type { FplTable, HospitalPolicy } from "./types";

export function getHospitals(): HospitalPolicy[] {
  return hospitalsJson.hospitals as unknown as HospitalPolicy[];
}

export function getHospital(id: string): HospitalPolicy | null {
  return getHospitals().find((h) => h.id === id) ?? null;
}

export function getFplTable(): FplTable {
  return fplJson as FplTable;
}
