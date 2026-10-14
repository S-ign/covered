/**
 * The fillable-forms API is a preview feature. It is switched off on Vercel production deployments
 * (VERCEL_ENV === "production") unless ENABLE_FORMS_API=1 is set on purpose. Preview deployments
 * and local development have it on.
 */
export function formsApiEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.VERCEL_ENV !== "production" || env.ENABLE_FORMS_API === "1";
}
