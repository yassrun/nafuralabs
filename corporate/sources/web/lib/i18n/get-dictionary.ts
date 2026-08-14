import type { Locale } from './config';
import { defaultLocale, isLocale } from './config';
import en from './messages/en.json';
import fr from './messages/fr.json';

const dictionaries = { en, fr } as const;

export type Dictionary = typeof en;

export async function getDictionary(locale: string): Promise<Dictionary> {
  const l = isLocale(locale) ? locale : defaultLocale;
  return dictionaries[l];
}
