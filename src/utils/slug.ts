/**
 * URL-safe slug from any language (Arabic, Latin, etc.).
 * Keeps Unicode letters and numbers; other characters become hyphens.
 */
export function toSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/(^-|-$)/g, '');
}
