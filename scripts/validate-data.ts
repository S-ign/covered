import { readFileSync } from "node:fs";
import { validateHospitals, validateFpl } from "../src/lib/validate";

const hospitals = JSON.parse(readFileSync("data/hospitals.json", "utf8")).hospitals;
const fpl = JSON.parse(readFileSync("data/fpl-2026.json", "utf8"));
const errors = [...validateHospitals(hospitals), ...validateFpl(fpl)];
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`ok: ${hospitals.length} hospitals, FPL ${fpl.year}`);
