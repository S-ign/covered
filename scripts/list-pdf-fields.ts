import { listPdfFields } from "../src/lib/forms/fill";

// Usage: npm run pdf:fields data/forms/piedmont.pdf
async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: npm run pdf:fields <path-to-fillable.pdf>");
    process.exit(1);
  }
  const fields = await listPdfFields(file);
  for (const f of fields) console.log(`${f.kind.padEnd(6)} ${JSON.stringify(f.name)}${f.options ? `  options: ${f.options.join(", ")}` : ""}`);
  console.log(`\n${fields.length} fields`);
}
void main();
