export function normalizeVariantFeatures(
  features?: Record<string, unknown> | null,
): Record<string, string> {
  if (!features || typeof features !== 'object') return {};

  return Object.entries(features).reduce<Record<string, string>>((acc, [key, value]) => {
    const trimmedKey = key.trim();
    const trimmedValue = String(value ?? '').trim();
    if (trimmedKey && trimmedValue) {
      acc[trimmedKey] = trimmedValue;
    }
    return acc;
  }, {});
}
