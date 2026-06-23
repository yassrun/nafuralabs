'use client';

import { createContext, useContext } from 'react';
import type { Dictionary } from '@/lib/i18n/get-dictionary';

const DictionaryContext = createContext<Dictionary | null>(null);

export function I18nProvider({
  dictionary,
  children,
}: {
  dictionary: Dictionary;
  children: React.ReactNode;
}) {
  return (
    <DictionaryContext.Provider value={dictionary}>
      {children}
    </DictionaryContext.Provider>
  );
}

export function useDictionary() {
  const ctx = useContext(DictionaryContext);
  if (!ctx) {
    throw new Error('useDictionary must be used within I18nProvider');
  }
  return ctx;
}
