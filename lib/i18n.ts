

// lib/i18n.ts
export const SUPPORTED_LANGUAGES = [
  "es",
  "en",
  "fr",
  "it",
  "no",
  "de",
  "pl",
  "sv",
  "fi",
  "da",
  "hu",
  "pt",
] as const;

export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: AppLanguage = "en";

export function isSupportedLanguage(value: string): value is AppLanguage {
  return SUPPORTED_LANGUAGES.includes(value as AppLanguage);
}

export function normalizeLanguage(value?: string | null): AppLanguage {
  if (!value) return DEFAULT_LANGUAGE;

  const normalized = value.trim().toLowerCase();
  return isSupportedLanguage(normalized) ? normalized : DEFAULT_LANGUAGE;
}