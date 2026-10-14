import { FORMS } from "@/lib/forms/definitions";
import { disabledResponse, json } from "@/lib/forms/http";

export const runtime = "nodejs";

/** GET /api/forms: the hospitals that have a fillable application, and where to read each one's questions. */
export function GET() {
  const off = disabledResponse();
  if (off) return off;
  return json({
    preview: true,
    forms: Object.values(FORMS).map((f) => ({
      hospital_id: f.id,
      title: f.title,
      schema: `/api/forms/${f.id}`,
      fill: `/api/forms/${f.id}`,
      validate: `/api/forms/${f.id}/validate`,
      field_count: f.fields.length + f.lists.length,
    })),
  });
}
