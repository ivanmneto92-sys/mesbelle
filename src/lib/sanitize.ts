import DOMPurify from "dompurify";

/**
 * Sanitize untrusted text before rendering it inside HTML attributes or
 * dangerouslySetInnerHTML. Strips every tag and attribute by default —
 * use only for raw text content.
 */
export function sanitizeText(input: string | null | undefined): string {
  if (!input) return "";
  return DOMPurify.sanitize(String(input), { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}
